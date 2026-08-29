const mongoose = require("mongoose");

/**
 * A curated general-knowledge question about India's living heritage.
 * Correct answers are never sent to the client on GET — only on
 * POST /api/quiz/submit, after grading, so the quiz can't be trivially
 * inspected via the network tab before answering.
 */
const QuizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 6,
    },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: "" },
    category: {
      type: String,
      enum: ["Art", "Craft", "Dance", "Festival", "Oral History", "Language", "Recipe", "Heritage Site", "General"],
      default: "General",
    },
    state: { type: String },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    relatedHeritage: { type: mongoose.Schema.Types.ObjectId, ref: "Heritage" },
    verificationStatus: {
      type: String,
      enum: ["pending", "community_verified", "institution_verified", "prototype"],
      default: "prototype",
    },
    sources: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizQuestion", QuizQuestionSchema);
