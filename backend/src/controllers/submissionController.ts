import { RequestHandler } from 'express';
import Submission from '../models/Submission';

// Writer submits a question
export const createSubmission: RequestHandler = async (req, res) => {
  try {
    const { category, subject, topic, question, choices, explanations, reference, difficulty, images, status, writer, correctChoice } = req.body;
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

// Get submissions (writer: own, admin: all, with filters)
export const getSubmissions: RequestHandler = async (req, res) => {
  try {
    const { category, subject, topic, status, writer } = req.query;
    const filter: any = {};
    const user = (req as any).user;
    if (user?.role === 'writer') {
      filter.writer = user.id;
      if (status) {
        // Support comma-separated status (e.g., 'rejected,draft')
        const statusArr = String(status).split(',');
        filter.status = { $in: statusArr };
      }
    } else if (user?.role === 'admin') {
      if (status) {
        // Only show drafts if explicitly requested
        const statusArr = String(status).split(',');
        if (!statusArr.includes('draft')) {
          filter.status = { $in: statusArr.filter(s => s !== 'draft') };
        } else {
          filter.status = { $in: statusArr };
        }
      } else {
        // By default, exclude drafts for admin
        filter.status = { $ne: 'draft' };
      }
      if (writer) {
        filter.writer = writer;
      }
    }
    if (category) filter.category = category;
    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
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
        console.log('Invalid status value received:', status);
        res.status(400).json({ message: 'Invalid status value' });
        return;
      }
      // Build update object
      const updateObj: any = { ...rest };
      if (status) updateObj.status = status;
      if (rejectionReason !== undefined) updateObj.rejectionReason = rejectionReason;
      console.log('PATCH admin:', { id, updateObj });
      const updated = await Submission.findByIdAndUpdate(
        id,
        updateObj,
        { new: true }
      );
      console.log('Updated submission:', updated);
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