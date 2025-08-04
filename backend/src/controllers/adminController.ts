import { Request, Response, RequestHandler } from 'express';
import User from '../models/User';
import Submission from '../models/Submission';
import Penalty from '../models/Penalty';
import OsceStation from '../models/OsceStation';
import mongoose from 'mongoose';

export const getStats: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const totalUsers = await User.countDocuments();
    // Fetch both types
    const sba = await Submission.find().populate('writer', 'name email');
    const osce = await OsceStation.find().populate('writer', 'name email');
    // Tag and merge
    const sbaWithType = sba.map((q) => ({ ...q.toObject(), type: 'SBA' }));
    const osceWithType = osce.map((q) => ({ ...q.toObject(), type: 'OSCE' }));
    const all = [...sbaWithType, ...osceWithType].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // Stats by status (merged)
    const submissionsByStatus = all.reduce((acc: Record<string, number>, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const totalSubmissions = all.length;
    const allSubmissions = all;
    const recentSubmissions = all.slice(0, 5);
    res.json({
      totalUsers,
      totalSubmissions,
      submissionsByStatus,
      recentSubmissions,
      allSubmissions
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
  // POST /api/admin/penalties request received
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
    // Error in createPenalty occurred
    res.status(500).json({ message: 'Server error' });
  }
};

export const getWriters: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const writers = await User.find({ role: 'writer' }).select('name email');
    res.json(writers);
  } catch (err) {
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

// New endpoint: Get all submissions (SBA + OSCE)
export const getAllSubmissions: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    // Fetch both types
    const sba = await Submission.find().populate('writer', 'name email');
    const osce = await OsceStation.find().populate('writer', 'name email');
    // Normalize and tag type
    const sbaWithType = sba.map((q) => ({ ...q.toObject(), type: 'SBA' }));
    const osceWithType = osce.map((q) => ({ ...q.toObject(), type: 'OSCE' }));
    // Merge and sort by createdAt desc
    const all = [...sbaWithType, ...osceWithType].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ submissions: all });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 