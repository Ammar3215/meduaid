import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPenalty extends Document {
  writer: Types.ObjectId;
  reason: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

const PenaltySchema = new Schema<IPenalty>({
  writer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  points: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model<IPenalty>('Penalty', PenaltySchema); 