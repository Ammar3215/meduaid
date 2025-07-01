import { Request, Response, RequestHandler } from 'express';
import Submission from '../models/Submission';
import Penalty from '../models/Penalty';
import mongoose from 'mongoose';

export const getStats: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'writer') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const writerId = user.id;
    const totalSubmissions = await Submission.countDocuments({ writer: writerId });
    const submissionsByStatus = await Submission.aggregate([
      { $match: { writer: new mongoose.Types.ObjectId(writerId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const recentSubmissionsDocs = await Submission.find({ writer: writerId }).sort({ createdAt: -1 });
    const recentSubmissions = recentSubmissionsDocs.map(sub => ({
      _id: sub._id,
      category: sub.category,
      subject: sub.subject,
      topic: sub.topic,
      question: sub.question,
      choices: sub.choices,
      explanations: sub.explanations,
      reference: sub.reference,
      images: sub.images,
      status: sub.status,
      rejectionReason: sub.rejectionReason,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));
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