import { Request, Response, RequestHandler } from 'express';
import Submission from '../models/Submission';
import Penalty from '../models/Penalty';
import mongoose from 'mongoose';
import OsceStation from '../models/OsceStation';

export const getStats: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'writer') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const writerId = user.id;
    // SBA
    const sbaDocs = await Submission.find({ writer: writerId });
    const sba = sbaDocs.map(sub => ({
      ...sub.toObject(),
      type: 'SBA',
    }));
    // OSCE
    const osceDocs = await OsceStation.find({ writer: writerId });
    const osce = osceDocs.map(station => ({
      ...station.toObject(),
      type: 'OSCE',
    }));
    // Merge and sort
    const recentSubmissions = [...sba, ...osce].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // Stats
    const totalSubmissions = recentSubmissions.length;
    const submissionsByStatus = recentSubmissions.reduce((acc: Record<string, number>, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    res.json({
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

export const getPenalties: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'writer') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const penalties = await Penalty.find({ writer: user.id }).sort({ createdAt: -1 });
    res.json({ penalties });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 