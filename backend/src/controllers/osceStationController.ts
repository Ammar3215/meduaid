import { RequestHandler } from 'express';
import OsceStation from '../models/OsceStation';

// Helper function to calculate total marks
const calculateTotalMarks = (markingScheme: any[], followUps: any[]): number => {
  let total = 0;
  
  // Calculate from marking scheme
  if (markingScheme && Array.isArray(markingScheme)) {
    markingScheme.forEach((section: any) => {
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          const score = Number(item.score) || 0;
          if (score < 0) {
            throw new Error(`Invalid score: ${score}. Scores must be non-negative.`);
          }
          total += score;
        });
      }
    });
  }
  
  // Calculate from follow-ups
  if (followUps && Array.isArray(followUps)) {
    followUps.forEach((followUp: any) => {
      const score = Number(followUp.score) || 0;
      if (score < 0) {
        throw new Error(`Invalid follow-up score: ${score}. Scores must be non-negative.`);
      }
      total += score;
    });
  }
  
  return total;
};

// Helper function to validate scoring data
const validateScoringData = (markingScheme: any[], followUps: any[], totalMarks?: number): void => {
  // Validate that either marking scheme or follow-ups exist
  const hasMarkingScheme = markingScheme && Array.isArray(markingScheme) && markingScheme.length > 0;
  const hasFollowUps = followUps && Array.isArray(followUps) && followUps.length > 0;
  
  if (!hasMarkingScheme && !hasFollowUps) {
    throw new Error('Either marking scheme or follow-up questions are required.');
  }
  
  // Validate marking scheme structure if it exists
  if (hasMarkingScheme) {
    markingScheme.forEach((section: any, sectionIndex: number) => {
      if (!section.section || typeof section.section !== 'string') {
        throw new Error(`Section ${sectionIndex + 1} must have a valid name.`);
      }
      // Allow empty sections initially - they can be filled later
      if (!section.items || !Array.isArray(section.items)) {
        throw new Error(`Section "${section.section}" must have an items array.`);
      }
      // Only validate items if they exist
      if (section.items.length > 0) {
        section.items.forEach((item: any, itemIndex: number) => {
          if (!item.desc || typeof item.desc !== 'string') {
            throw new Error(`Item ${itemIndex + 1} in section "${section.section}" must have a description.`);
          }
          if (typeof item.score !== 'number' || item.score < 0) {
            throw new Error(`Item "${item.desc}" must have a valid non-negative score.`);
          }
        });
      }
    });
  }
  
  // Validate follow-ups if provided
  if (followUps && Array.isArray(followUps)) {
    followUps.forEach((followUp: any, index: number) => {
      if (!followUp.question || typeof followUp.question !== 'string') {
        throw new Error(`Follow-up question ${index + 1} must have a valid question.`);
      }
      if (!followUp.answers || !Array.isArray(followUp.answers) || followUp.answers.length === 0) {
        throw new Error(`Follow-up question "${followUp.question}" must have at least one answer.`);
      }
      if (typeof followUp.score !== 'number' || followUp.score < 0) {
        throw new Error(`Follow-up question "${followUp.question}" must have a valid non-negative score.`);
      }
    });
  }
  
  // Validate total marks consistency if provided
  if (totalMarks !== undefined) {
    const calculatedTotal = calculateTotalMarks(markingScheme, followUps);
    if (Math.abs(totalMarks - calculatedTotal) > 0.01) { // Allow small floating point differences
      throw new Error(`Total marks mismatch: provided ${totalMarks}, calculated ${calculatedTotal}.`);
    }
  }
};

// Create OSCE station (writer submission)
export const createOsceStation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const {
      category, subject, topic, subtopic, title, type, caseDescription,
      historySections, markingScheme, followUps, images, status, writer, totalMarks
    } = req.body;
    
    // Validate scoring data
    validateScoringData(markingScheme, followUps);
    
    // Determine the writer ID
    let writerId;
    if (user?.role === 'admin' && writer) {
      // Admin is creating for a specific writer
      writerId = writer;
    } else {
      // Writer is creating for themselves, or admin didn't specify writer
      writerId = user?.id;
    }
    
    // Calculate total marks automatically (use provided totalMarks if available, otherwise calculate)
    const calculatedTotalMarks = totalMarks !== undefined ? totalMarks : calculateTotalMarks(markingScheme, followUps);
    
    // Ensure followUps have scores
    const validatedFollowUps = followUps.map((followUp: any) => ({
      question: followUp.question,
      answers: followUp.answers,
      score: Number(followUp.score) || 0
    }));
    
    const osce = await OsceStation.create({
      writer: writerId,
      category, subject, topic, subtopic, title, type, caseDescription,
      historySections, markingScheme, followUps: validatedFollowUps, images,
      totalMarks: calculatedTotalMarks,
      status: status || 'pending',
    });
    res.status(201).json(osce);
  } catch (err: any) {
    // OSCE station creation error occurred
    if (err.message && (err.message.includes('score') || err.message.includes('marking') || err.message.includes('follow-up'))) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// Get all OSCE stations (writer: own, admin: all, with optional filters)
export const getOsceStations: RequestHandler = async (req, res) => {
  try {
    const { status, category, writer } = req.query;
    const filter: any = {};
    const user = (req as any).user;
    
    // Check user role and apply appropriate filtering
    if (user?.role === 'writer') {
      // Writers can only see their own OSCE stations
      filter.writer = user.id;
      if (status) {
        // Support comma-separated status (e.g., 'rejected,draft')
        const statusArr = String(status).split(',');
        filter.status = { $in: statusArr };
      }
    } else if (user?.role === 'admin') {
      // Admins can see all OSCE stations
      if (status) {
        const statusArr = String(status).split(',');
        filter.status = { $in: statusArr };
      }
      if (writer) {
        filter.writer = writer;
      }
    } else {
      // Unauthorized
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    if (category) filter.category = category;
    
    const stations = await OsceStation.find(filter)
      .populate('writer', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(stations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single OSCE station by ID
export const getOsceStationById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const station = await OsceStation.findById(id).populate('writer', 'name email');
    if (!station) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    
    // Check if user has permission to access this station
    if (user?.role === 'writer') {
      // Get the writer ID - handle both populated and unpopulated cases
      let stationWriterId;
      const writer = station.writer as any;
      if (writer && writer._id) {
        // Writer is populated, get the _id from the populated object
        stationWriterId = writer._id.toString();
      } else {
        // Writer is not populated, it's just the ObjectId
        stationWriterId = (station.writer as any).toString();
      }
      
      if (stationWriterId !== user.id) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    }
    
    // Admins can access any station, writers can only access their own
    res.json(station.toObject());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update OSCE station (approve/reject/feedback)
export const updateOsceStation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = (req as any).user;
    
    const station = await OsceStation.findById(id);
    if (!station) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    
    // Check if user has permission to update this station
    if (user?.role === 'writer' && station.writer.toString() !== user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    const update: any = {};
    if (status) update.status = status;
    if (status === 'rejected' && req.body.rejectionReason !== undefined) update.rejectionReason = req.body.rejectionReason;
    
    // Allow admin or the station owner (writer) to update all fields
    if (user?.role === 'admin' || (user?.role === 'writer' && station.writer.toString() === user.id)) {
      const fields = [
        'category', 'subject', 'topic', 'subtopic', 'title', 'type', 'caseDescription',
        'historySections', 'markingScheme', 'images'
      ];
      for (const field of fields) {
        if (req.body[field] !== undefined) update[field] = req.body[field];
      }
      
      // Handle followUps separately to ensure they have scores
      if (req.body.followUps !== undefined) {
        const validatedFollowUps = req.body.followUps.map((followUp: any) => ({
          question: followUp.question,
          answers: followUp.answers,
          score: Number(followUp.score) || 0
        }));
        update.followUps = validatedFollowUps;
      }
      
      // Recalculate totalMarks if markingScheme or followUps are updated
      if (req.body.markingScheme !== undefined || req.body.followUps !== undefined) {
        const updatedMarkingScheme = req.body.markingScheme !== undefined ? req.body.markingScheme : station.markingScheme;
        const updatedFollowUps = req.body.followUps !== undefined ? update.followUps : station.followUps;
        
        // Validate the updated scoring data
        validateScoringData(updatedMarkingScheme, updatedFollowUps);
        
        update.totalMarks = calculateTotalMarks(updatedMarkingScheme, updatedFollowUps);
      }
    }
    
    const updatedStation = await OsceStation.findByIdAndUpdate(id, update, { new: true });
    res.json(updatedStation);
  } catch (err: any) {
    // OSCE station update error occurred
    if (err.message && (err.message.includes('score') || err.message.includes('marking') || err.message.includes('follow-up'))) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// Delete OSCE station
export const deleteOsceStation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const station = await OsceStation.findById(id);
    if (!station) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    
    // Check if user has permission to delete this station
    if (user?.role === 'writer' && station.writer.toString() !== user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    // Allow admin or the station owner (writer) to delete
    if (user?.role === 'admin' || (user?.role === 'writer' && station.writer.toString() === user.id)) {
      await OsceStation.findByIdAndDelete(id);
      res.json({ message: 'OSCE station deleted successfully' });
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  } catch (err) {
    // OSCE station deletion error occurred
    res.status(500).json({ message: 'Server error' });
  }
}; 