import { RequestHandler } from 'express';
import Submission from '../models/Submission';

// Writer submits a question
export const createSubmission: RequestHandler = async (req, res) => {
  try {
    const { category, subject, topic, question, choices, explanations, reference, difficulty, images } = req.body;
    const writerId = (req as any).user?.id;
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

    // Writers can only update their own rejected submissions (to resubmit)
    if (
      user?.role === 'writer' &&
      submission.writer.toString() === user.id &&
      submission.status === 'rejected'
    ) {
      // Only allow updating question fields and set status to 'pending'
      const allowedFields: any = {
        status: 'pending',
        rejectionReason: '',
      };
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