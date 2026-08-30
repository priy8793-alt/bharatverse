const mongoose = require("mongoose");

const ContributionSchema = new mongoose.Schema(
  {
    contributor: { type: String, default: "Anonymous" }, // name is optional per spec
    contributorEmail: { type: String },
    type: {
      type: String,
      required: true,
      enum: [
        "Art",
        "Craft",
        "Dance",
        "Festival",
        "Oral History",
        "Language",
        "Recipe",
        "Heritage Site",
        "Artisan",
      ],
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String },
    state: { type: String, required: true },
    district: { type: String },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    community: { type: String },
    language: { type: String },

    images: [{ type: String }],
    audio: { type: String },
    video: { type: String },

    status: {
      type: String,
      enum: ["pending", "review", "verified", "published", "rejected"],
      default: "pending",
    },
    verificationNotes: { type: String },
  },
  { timestamps: true }
);

ContributionSchema.index({ title: "text", description: "text", state: "text" });

module.exports = mongoose.model("Contribution", ContributionSchema);
