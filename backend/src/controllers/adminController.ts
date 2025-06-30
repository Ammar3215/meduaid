import { Request, Response, RequestHandler } from 'express';
import User from '../models/User';
import Submission from '../models/Submission';
import Penalty from '../models/Penalty';
import mongoose from 'mongoose';

export const getStats: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const totalUsers = await User.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    const submissionsByStatus = await Submission.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const recentSubmissions = await Submission.find().sort({ createdAt: -1 }).limit(5).populate('writer', 'name email');
    res.json({
      totalUsers,
      totalSubmissions,
      submissionsByStatus,
      recentSubmissions
    });
    return;
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getRecentPenalties: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const penalties = await Penalty.find().sort({ createdAt: -1 }).populate('writer', 'name email');
    res.json({ penalties });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPenalty: RequestHandler = async (req, res) => {
  console.log('POST /api/admin/penalties', req.body);
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const { writer, reason, type, amount } = req.body;
    if (!writer || !reason || !type) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    if (type === 'monetary' && (amount === undefined || amount === null || amount === '')) {
      res.status(400).json({ message: 'Amount is required for monetary penalties' });
      return;
    }
    // Find writer by email or id (only use _id if valid ObjectId)
    let writerQuery: any[] = [{ email: writer }];
    if (mongoose.Types.ObjectId.isValid(writer)) {
      writerQuery.unshift({ _id: writer });
    }
    const writerUser = await User.findOne({ $or: writerQuery });
    if (!writerUser) {
      res.status(404).json({ message: 'Writer not found' });
      return;
    }
    // Create penalty
    const penaltyData: any = {
      writer: writerUser._id,
      reason,
      type,
    };
    if (type === 'monetary') {
      penaltyData.amount = Number(amount);
    }
    const penalty = await Penalty.create(penaltyData);
    const populatedPenalty = await Penalty.findById(penalty._id).populate('writer', 'name email');
    res.status(201).json(populatedPenalty);
  } catch (err) {
    console.error('Error in createPenalty:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePenalty: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const { id } = req.params;
    const penalty = await Penalty.findByIdAndDelete(id);
    if (!penalty) {
      res.status(404).json({ message: 'Penalty not found' });
      return;
    }
    res.status(200).json({ message: 'Penalty removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 