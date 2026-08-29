const mongoose = require("mongoose");

const QuizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional — quiz can be taken anonymously
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuizQuestion" }],
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    state: { type: String },
    category: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
