import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubmission extends Document {
  writer: Types.ObjectId;
  category: string;
  subject: string;
  topic: string;
  question: string;
  choices: string[];
  explanations: string[];
  reference: string;
  difficulty: 'easy' | 'normal' | 'hard';
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  writer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  question: { type: String, required: true },
  choices: { type: [String], required: true },
  explanations: { type: [String], required: true },
  reference: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'normal', 'hard'], required: true },
  images: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
}, { timestamps: true });

export default mongoose.model<ISubmission>('Submission', SubmissionSchema); 