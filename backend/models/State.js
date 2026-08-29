const mongoose = require("mongoose");

/**
 * One document per Indian state/UT. Kept intentionally close to the shape
 * the existing frontend prototype already used (region, capital,
 * traditions, artForms, festivals, languages, artisan) so the prototype's
 * data can be upgraded into the database with minimal reshaping.
 */
const StateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    region: { type: String, required: true },
    capital: { type: String, required: true },
    highlights: { type: String, default: "" },
    traditions: [{ type: String }],
    artForms: [{ type: String }],
    festivals: [{ type: String }],
    languages: [{ type: String }],
    featuredArtisan: {
      name: String,
      craft: String,
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "community_verified", "institution_verified", "prototype"],
      default: "prototype",
    },
    sources: [{ type: String }],
  },
  { timestamps: true }
);

StateSchema.index({ name: "text", region: "text", highlights: "text" });

module.exports = mongoose.model("State", StateSchema);
