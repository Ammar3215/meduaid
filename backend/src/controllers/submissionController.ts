import { RequestHandler } from 'express';
import Submission from '../models/Submission';

// Writer submits a question
export const createSubmission: RequestHandler = async (req, res) => {
  try {
    const { category, subject, topic, subtopic, question, choices, explanations, reference, difficulty, images, status, writer, correctChoice } = req.body;
    let writerId = (req as any).user?.id;
    const user = (req as any).user;
    // If admin and writer is provided, use that
    if (user?.role === 'admin' && writer) {
      writerId = writer;
    }
    const submission = await Submission.create({
      writer: writerId,
      category,
      subject,
      topic,
      subtopic,
      question,
      choices,
      explanations,
      reference,
      difficulty,
      images: images || [],
      status: status === 'draft' ? 'draft' : 'pending',
      correctChoice,
    });
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Input sanitization helper
const sanitizeStringInput = (input: any): string | null => {
  if (typeof input !== 'string' || input.trim() === '') return null;
  return input.trim();
};

// Get submissions (writer: own, admin: all, with filters)
export const getSubmissions: RequestHandler = async (req, res) => {
  try {
    const { category, subject, topic, status, writer } = req.query;
    const filter: any = {};
    const user = (req as any).user;
    
    if (user?.role === 'writer') {
      filter.writer = user.id;
      if (status) {
        // Sanitize status input and support comma-separated values
        const sanitizedStatus = sanitizeStringInput(status);
        if (sanitizedStatus) {
          const statusArr = sanitizedStatus.split(',').map(s => s.trim()).filter(s => 
            ['pending', 'approved', 'rejected', 'draft'].includes(s)
          );
          if (statusArr.length > 0) {
            filter.status = { $in: statusArr };
          }
        }
      }
    } else if (user?.role === 'admin') {
      if (status) {
        // Sanitize status input for admin
        const sanitizedStatus = sanitizeStringInput(status);
        if (sanitizedStatus) {
          const statusArr = sanitizedStatus.split(',').map(s => s.trim()).filter(s => 
            ['pending', 'approved', 'rejected', 'draft'].includes(s)
          );
          if (statusArr.length > 0) {
            if (!statusArr.includes('draft')) {
              filter.status = { $in: statusArr.filter(s => s !== 'draft') };
            } else {
              filter.status = { $in: statusArr };
            }
          }
        }
      } else {
        // By default, exclude drafts for admin
        filter.status = { $ne: 'draft' };
      }
      if (writer) {
        // Sanitize writer input - must be a valid string
        const sanitizedWriter = sanitizeStringInput(writer);
        if (sanitizedWriter) {
          filter.writer = sanitizedWriter;
        }
      }
    }
    
    // Sanitize category, subject, topic inputs
    const sanitizedCategory = sanitizeStringInput(category);
    if (sanitizedCategory) filter.category = sanitizedCategory;
    
    const sanitizedSubject = sanitizeStringInput(subject);
    if (sanitizedSubject) filter.subject = sanitizedSubject;
    
    const sanitizedTopic = sanitizeStringInput(topic);
    if (sanitizedTopic) filter.topic = sanitizedTopic;
    
    const submissions = await Submission.find(filter).populate('writer', 'name email');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin updates submission status
export const updateSubmissionStatus: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { status, rejectionReason, ...rest } = req.body;

    // Find the submission
    const submission = await Submission.findById(id);
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }

    // Admins can update any submission
    if (user?.role === 'admin') {
      // Validate status value if present
      const allowedStatuses = ['pending', 'approved', 'rejected'];
      if (status && !allowedStatuses.includes(status)) {
        // Invalid status value received
        res.status(400).json({ message: 'Invalid status value' });
        return;
      }
      
      // SECURITY FIX: Whitelist allowed fields instead of using spread operator
      const allowedFields = ['question', 'choices', 'explanations', 'reference', 'difficulty', 'category', 'subject', 'topic', 'subtopic'];
      const updateObj: any = {};
      
      // Only allow specific fields to be updated
      allowedFields.forEach(field => {
        if (rest[field] !== undefined) {
          updateObj[field] = rest[field];
        }
      });
      
      // Add admin-specific fields
      if (status) updateObj.status = status;
      if (rejectionReason !== undefined) updateObj.rejectionReason = rejectionReason;
      // Admin PATCH request processed
      const updated = await Submission.findByIdAndUpdate(
        id,
        updateObj,
        { new: true }
      );
      // Submission updated successfully
      res.json(updated);
      return;
    }

    // Writers can update their own rejected or draft submissions
    if (
      user?.role === 'writer' &&
      submission.writer.toString() === user.id &&
      (submission.status === 'rejected' || submission.status === 'draft')
    ) {
      let allowedFields: any = {};
      if (submission.status === 'rejected') {
        allowedFields.status = 'pending';
        allowedFields.rejectionReason = '';
      } else if (submission.status === 'draft') {
        // Allow status to be set to 'pending' (submit) or remain 'draft' (save as draft)
        allowedFields.status = status === 'pending' ? 'pending' : 'draft';
      }
      if (rest.question !== undefined) allowedFields.question = rest.question;
      if (rest.choices !== undefined) allowedFields.choices = rest.choices;
      if (rest.explanations !== undefined) allowedFields.explanations = rest.explanations;
      if (rest.reference !== undefined) allowedFields.reference = rest.reference;
      if (rest.difficulty !== undefined) allowedFields.difficulty = rest.difficulty;
      const updated = await Submission.findByIdAndUpdate(id, allowedFields, { new: true });
      res.json(updated);
      return;
    }

    res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a submission (question)
export const deleteSubmission: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const submission = await Submission.findById(id);
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }
    if (user?.role === 'admin') {
      await Submission.findByIdAndDelete(id);
      res.json({ message: 'Submission deleted' });
      return;
    }
    if (
      user?.role === 'writer' &&
      submission.writer.toString() === user.id &&
      ['draft', 'rejected', 'pending'].includes(submission.status)
    ) {
      await Submission.findByIdAndDelete(id);
      res.json({ message: 'Submission deleted' });
      return;
    }
    res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single submission by ID
export const getSubmissionById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id).populate('writer', 'name email');
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 