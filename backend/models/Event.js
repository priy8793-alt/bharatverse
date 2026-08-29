const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String },
    date: { type: Date },
    location: { type: String },
    category: {
      type: String,
      enum: ["Festival", "Workshop", "Performance", "Exhibition", "Documentation Drive"],
      default: "Festival",
    },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["live", "upcoming", "recent"],
      default: "upcoming",
    },
    source: { type: String, default: "Prototype Event Data" },
    isPrototypeData: { type: Boolean, default: true },
  },
  { timestamps: true }
);

EventSchema.index({ name: "text", state: "text", description: "text" });

module.exports = mongoose.model("Event", EventSchema);
