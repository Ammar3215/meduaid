import { RequestHandler } from 'express';
import Submission from '../models/Submission';

// Writer submits a question
export const createSubmission: RequestHandler = async (req, res) => {
  try {
    const { category, subject, topic } = req.body;
    const writerId = (req as any).user?.id;
    const submission = await Submission.create({
      writer: writerId,
      category,
      subject,
      topic,
      status: 'pending',
    });
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get submissions (writer: own, admin: all, with filters)
export const getSubmissions: RequestHandler = async (req, res) => {
  try {
    const { category, subject, topic, status, writer } = req.query;
    const filter: any = {};
    const user = (req as any).user;
    if (user?.role === 'writer') {
      filter.writer = user.id;
    } else if (writer) {
      filter.writer = writer;
    }
    if (category) filter.category = category;
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (status) filter.status = status;
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
    if (user?.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      id,
      { status, rejectionReason },
      { new: true }
    );
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 