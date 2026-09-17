import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 120 },
    url: { type: String, required: true, maxlength: 2048 },
    description: { type: String, default: "", maxlength: 1000 },
    seedKey: { type: String, select: false },
  },
  { timestamps: true, versionKey: false },
);
schema.index({ createdAt: -1 });
schema.index({ seedKey: 1 }, { unique: true, sparse: true });
export const Image = mongoose.model("Image", schema);
