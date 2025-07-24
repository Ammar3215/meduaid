import { RequestHandler } from 'express';
import OsceStation from '../models/OsceStation';

// Create OSCE station (writer submission)
export const createOsceStation: RequestHandler = async (req, res) => {
  try {
    const writerId = (req as any).user?.id;
    const {
      category, subject, topic, subtopic, title, type, caseDescription,
      historySections, markingScheme, followUps, images
    } = req.body;
    const osce = await OsceStation.create({
      writer: writerId,
      category, subject, topic, subtopic, title, type, caseDescription,
      historySections, markingScheme, followUps, images,
      status: 'pending',
    });
    res.status(201).json(osce);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all OSCE stations (admin, with optional filters)
export const getOsceStations: RequestHandler = async (req, res) => {
  try {
    const { status, category, writer } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (writer) filter.writer = writer;
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
    const station = await OsceStation.findById(id).populate('writer', 'name email');
    if (!station) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
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
    const update: any = {};
    if (status) update.status = status;
    const station = await OsceStation.findByIdAndUpdate(id, update, { new: true });
    if (!station) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.json(station);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 