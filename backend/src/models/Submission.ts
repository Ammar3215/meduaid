import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubmission extends Document {
  writer: Types.ObjectId;
  category: string;
  subject: string;
  topic: string;
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
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
}, { timestamps: true });

export default mongoose.model<ISubmission>('Submission', SubmissionSchema); 