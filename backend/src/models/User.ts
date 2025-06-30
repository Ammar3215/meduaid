import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'writer' | 'admin';
  verified: boolean;
  emailVerificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['writer', 'admin'], default: 'writer' },
  verified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema); 