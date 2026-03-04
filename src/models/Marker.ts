import mongoose, { Schema, Document } from "mongoose";

export interface IMarker extends Document {
  userId: mongoose.Types.ObjectId;
  lat: number;
  lng: number;
  type: "house" | "business" | "other";
  notes?: string;
  timestamp: Date;
}

const MarkerSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    type: { type: String, enum: ["house", "business", "other"], default: "house" },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Marker || mongoose.model<IMarker>("Marker", MarkerSchema);
