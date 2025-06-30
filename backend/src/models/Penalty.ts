import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPenalty extends Document {
  writer: Types.ObjectId;
  reason: string;
  type: 'strike' | 'monetary';
  amount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PenaltySchema = new Schema<IPenalty>({
  writer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  type: { type: String, enum: ['strike', 'monetary'], required: true },
  amount: { type: Number },
}, { timestamps: true });

export default mongoose.model<IPenalty>('Penalty', PenaltySchema); 