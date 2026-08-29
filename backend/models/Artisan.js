const mongoose = require("mongoose");

const ArtisanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    craft: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String },
    community: { type: String },
    story: { type: String, default: "" },
    skills: [{ type: String }],
    images: [{ type: String }],

    isPrototypeProfile: { type: Boolean, default: true }, // true unless a real, consented profile
    verificationStatus: {
      type: String,
      enum: ["pending", "community_verified", "institution_verified", "prototype"],
      default: "prototype",
    },
    consentStatus: {
      type: String,
      enum: ["not_applicable", "pending", "granted", "declined"],
      default: "not_applicable",
    },

    contact: {
      // Prototype-safe: never fabricated. Left empty unless a real
      // artisan/institution supplies it and consents to publish it.
      email: { type: String },
      phone: { type: String },
    },
  },
  { timestamps: true }
);

ArtisanSchema.index({ name: "text", craft: "text", state: "text", community: "text" });

module.exports = mongoose.model("Artisan", ArtisanSchema);
