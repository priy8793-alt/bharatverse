const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    location: { type: String },
    state: { type: String },
    language: { type: String, default: "English" },

    audio: { type: String }, // URL to audio file; null/undefined => no audio available
    isDemoAudio: { type: Boolean, default: true }, // must be true unless a real recording is attached
    duration: { type: Number }, // seconds
    transcript: { type: String },
    speaker: { type: String }, // contributor / speaker name, optional

    images: [{ type: String }],

    verificationStatus: {
      type: String,
      enum: ["pending", "community_verified", "institution_verified", "prototype"],
      default: "prototype",
    },
    sources: [{ type: String }],
  },
  { timestamps: true }
);

StorySchema.index({ title: "text", description: "text", location: "text" });

module.exports = mongoose.model("Story", StorySchema);
