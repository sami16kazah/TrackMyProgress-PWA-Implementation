import mongoose, { Schema, Document } from "mongoose";

export interface IArea extends Document {
  userId: mongoose.Types.ObjectId;
  coordinates: number[][]; // Array of [lat, lng]
  name: string;
  notes?: string;
  timestamp: Date;
}

const AreaSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coordinates: { type: [[Number]], required: true },
    name: { type: String, required: true },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Area || mongoose.model<IArea>("Area", AreaSchema);
