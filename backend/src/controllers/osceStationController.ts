import { RequestHandler } from 'express';
import OsceStation from '../models/OsceStation';

// Create OSCE station (writer submission)
export const createOsceStation: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const {
      category, subject, topic, subtopic, title, type, caseDescription,
      historySections, markingScheme, followUps, images, status, writer
    } = req.body;
    
    // Determine the writer ID
    let writerId;
    if (user?.role === 'admin' && writer) {
      // Admin is creating for a specific writer
      writerId = writer;
    } else {
      // Writer is creating for themselves, or admin didn't specify writer
      writerId = user?.id;
    }
    
    const osce = await OsceStation.create({
      writer: writerId,
      category, subject, topic, subtopic, title, type, caseDescription,
      historySections, markingScheme, followUps, images,
      status: status || 'pending',
    });
    res.status(201).json(osce);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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
    // Always add type: 'OSCE' for frontend logic
    res.json({ ...station.toObject(), type: 'OSCE' });
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
        'historySections', 'markingScheme', 'followUps', 'images'
      ];
      for (const field of fields) {
        if (req.body[field] !== undefined) update[field] = req.body[field];
      }
    }
    
    const updatedStation = await OsceStation.findByIdAndUpdate(id, update, { new: true });
    res.json(updatedStation);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 