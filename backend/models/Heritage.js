const mongoose = require("mongoose");

const HeritageHealthIndicatorsSchema = new mongoose.Schema(
  {
    documentation: { type: Number, min: 0, max: 100 },
    practitionerBase: { type: Number, min: 0, max: 100 },
    youthParticipation: { type: Number, min: 0, max: 100 },
    practiceFrequency: { type: Number, min: 0, max: 100 },
    economicViability: { type: Number, min: 0, max: 100 },
    communityParticipation: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const HeritageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
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
        "Tradition",
      ],
    },
    state: { type: String, required: true },
    region: { type: String },
    district: { type: String },
    description: { type: String, default: "" },
    history: { type: String, default: "" },
    significance: { type: String, default: "" },
    materials: { type: String, default: "" },
    techniques: { type: String, default: "" },
    languages: [{ type: String }],
    festivals: [{ type: String }],

    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },

    images: [{ type: String }],

    // ---- Heritage Health / Risk Index ----
    healthScore: { type: Number, min: 0, max: 100 },
    healthStatus: {
      type: String,
      enum: ["stable", "vulnerable", "at_risk", "unassessed"],
      default: "unassessed",
    },
    healthIndicators: HeritageHealthIndicatorsSchema,
    healthExplanation: { type: String },

    // ---- Verification & sourcing ----
    verificationStatus: {
      type: String,
      enum: ["pending", "community_verified", "institution_verified", "prototype"],
      default: "prototype",
    },
    sources: [{ type: String }],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

HeritageSchema.index({ name: "text", state: "text", description: "text", category: "text" });
HeritageSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });

module.exports = mongoose.model("Heritage", HeritageSchema);
