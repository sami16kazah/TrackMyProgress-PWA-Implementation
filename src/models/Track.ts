import mongoose, { Schema, Document } from "mongoose";

export interface ITrack extends Document {
  userId: mongoose.Types.ObjectId;
  geojson: any; // Simplified GeoJSON object
  timestamp: Date;
}

const TrackSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    geojson: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Track || mongoose.model<ITrack>("Track", TrackSchema);
