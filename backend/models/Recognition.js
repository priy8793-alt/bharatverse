const mongoose = require("mongoose");

/**
 * A log of every recognition request/response. Kept so the prototype can
 * demonstrate a real audit trail — never used to fabricate confidence.
 */
const RecognitionSchema = new mongoose.Schema(
  {
    imageUrl: { type: String }, // local path or Cloudinary URL of the uploaded image
    predictedArt: { type: String },
    state: { type: String },
    region: { type: String },
    category: { type: String },
    confidence: { type: Number, min: 0, max: 1 },
    analysis: {
      history: String,
      meaning: String,
      materials: String,
      technique: String,
    },
    relatedHeritage: [{ type: mongoose.Schema.Types.ObjectId, ref: "Heritage" }],
    sources: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ["pending", "community_verified", "institution_verified", "prototype"],
      default: "prototype",
    },
    model: { type: String, default: "none" }, // e.g. "demo", or a real vision model name
    mode: { type: String, enum: ["live", "demo"], required: true, default: "demo" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recognition", RecognitionSchema);
