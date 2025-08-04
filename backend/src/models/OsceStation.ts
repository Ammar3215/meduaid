import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOsceStation extends Document {
  writer: Types.ObjectId;
  category: string;
  subject: string;
  topic: string;
  subtopic?: string;
  title: string;
  type: 'history' | 'examination';
  caseDescription: string;
  historySections?: { [key: string]: string };
  markingScheme: {
    section: string;
    items: { desc: string; score: number }[];
  }[];
  followUps: { question: string; answers: string[]; score: number }[];
  totalMarks: number;
  images: string[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OsceStationSchema = new Schema<IOsceStation>({
  writer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  subtopic: { type: String },
  title: { type: String, required: true },
  type: { type: String, enum: ['history', 'examination'], required: true },
  caseDescription: { type: String, required: true },
  historySections: { type: Schema.Types.Mixed },
  markingScheme: [
    {
      section: { type: String, required: true },
      items: [
        {
          desc: { type: String, required: true },
          score: { type: Number, required: true },
        },
      ],
    },
  ],
  followUps: [
    {
      question: { type: String, required: true },
      answers: { type: [String], required: true },
      score: { type: Number, required: true },
    },
  ],
  totalMarks: { type: Number, required: true },
  images: { type: [String], default: [] },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
}, { timestamps: true });

export default mongoose.model<IOsceStation>('OsceStation', OsceStationSchema); 