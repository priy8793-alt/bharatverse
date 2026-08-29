const QuizQuestion = require("../models/QuizQuestion");
const QuizAttempt = require("../models/QuizAttempt");
const { isDbReady } = require("../config/db");

// Small local fallback bank so the quiz still works the moment the DB is
// unavailable — clearly labelled DEMO, same honesty pattern used by the
// AI and recognition services elsewhere in this backend.
const DEMO_QUESTIONS = [
  {
    _id: "demo-1",
    question: "Sohrai wall painting is traditionally practised by tribal communities of which state?",
    options: ["Jharkhand", "Punjab", "Kerala", "Gujarat"],
    category: "Art",
    state: "Jharkhand",
    difficulty: "easy",
  },
  {
    _id: "demo-2",
    question: "Madhubani painting originates from the Mithila region of which state?",
    options: ["Bihar", "Assam", "Odisha", "Rajasthan"],
    category: "Art",
    state: "Bihar",
    difficulty: "easy",
  },
  {
    _id: "demo-3",
    question: "Kathakali is a classical dance-drama form native to which state?",
    options: ["Kerala", "Tamil Nadu", "West Bengal", "Maharashtra"],
    category: "Dance",
    state: "Kerala",
    difficulty: "easy",
  },
  {
    _id: "demo-4",
    question: "Pattachitra cloth-scroll painting is closely tied to which temple town?",
    options: ["Puri, Odisha", "Varanasi, UP", "Madurai, Tamil Nadu", "Dwarka, Gujarat"],
    category: "Art",
    state: "Odisha",
    difficulty: "medium",
  },
  {
    _id: "demo-5",
    question: "Warli painting traditionally uses which material to create its white pigment?",
    options: ["Rice paste", "Turmeric", "Indigo", "Charcoal"],
    category: "Art",
    state: "Maharashtra",
    difficulty: "medium",
  },
];
const DEMO_ANSWERS = { "demo-1": 0, "demo-2": 0, "demo-3": 0, "demo-4": 0, "demo-5": 0 };
const DEMO_EXPLANATIONS = {
  "demo-1": "Sohrai is painted by tribal communities (Kurmi, Santhal, Oraon) in Jharkhand during the harvest season.",
  "demo-2": "Madhubani painting takes its name from the Madhubani district in Bihar's Mithila region.",
  "demo-3": "Kathakali developed in Kerala, combining literature, music and elaborate face makeup.",
  "demo-4": "Pattachitra scrolls are traditionally created to accompany rituals at the Jagannath Temple in Puri.",
  "demo-5": "Warli artists apply white rice-paste paint onto an ochre-toned mud wall using a bamboo stick.",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getQuiz(req, res, next) {
  try {
    const { state, category, count = 5 } = req.query;
    const n = Math.min(15, Math.max(1, parseInt(count, 10) || 5));

    if (!isDbReady()) {
      const pool = DEMO_QUESTIONS.filter(
        (q) => (!state || q.state === state) && (!category || q.category === category)
      );
      const chosen = shuffle(pool.length ? pool : DEMO_QUESTIONS).slice(0, n);
      return res.json({
        mode: "demo",
        notice: "Database unavailable — serving a small built-in demo question bank.",
        questions: chosen.map(({ question, options, category, state, difficulty, _id }) => ({
          id: _id,
          question,
          options,
          category,
          state,
          difficulty,
        })),
      });
    }

    const filter = {};
    if (state) filter.state = state;
    if (category) filter.category = category;

    const total = await QuizQuestion.countDocuments(filter);
    if (total === 0) {
      return res.json({
        mode: "empty",
        notice: "No quiz questions match this filter yet.",
        questions: [],
      });
    }

    const docs = await QuizQuestion.aggregate([{ $match: filter }, { $sample: { size: n } }]);
    res.json({
      mode: "live",
      questions: docs.map((q) => ({
        id: q._id,
        question: q.question,
        options: q.options,
        category: q.category,
        state: q.state,
        difficulty: q.difficulty,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function submitQuiz(req, res, next) {
  try {
    const { answers, state, category } = req.body;
    if (!Array.isArray(answers) || !answers.length) {
      return res.status(400).json({ error: "`answers` must be a non-empty array of {questionId, selectedIndex}." });
    }

    const demoIds = answers.filter((a) => String(a.questionId).startsWith("demo-"));
    const liveIds = answers.filter((a) => !String(a.questionId).startsWith("demo-"));

    let liveDocs = [];
    if (liveIds.length && isDbReady()) {
      liveDocs = await QuizQuestion.find({ _id: { $in: liveIds.map((a) => a.questionId) } });
    }

    let score = 0;
    const results = [];

    for (const a of demoIds) {
      const correct = DEMO_ANSWERS[a.questionId];
      const isCorrect = correct === a.selectedIndex;
      if (isCorrect) score++;
      results.push({
        questionId: a.questionId,
        correct: isCorrect,
        correctIndex: correct,
        explanation: DEMO_EXPLANATIONS[a.questionId] || "",
      });
    }

    for (const a of liveIds) {
      const doc = liveDocs.find((d) => d._id.toString() === String(a.questionId));
      if (!doc) {
        results.push({ questionId: a.questionId, correct: false, error: "Question not found." });
        continue;
      }
      const isCorrect = doc.correctIndex === a.selectedIndex;
      if (isCorrect) score++;
      results.push({
        questionId: a.questionId,
        correct: isCorrect,
        correctIndex: doc.correctIndex,
        explanation: doc.explanation,
        relatedHeritage: doc.relatedHeritage,
      });
    }

    if (isDbReady() && liveIds.length) {
      QuizAttempt.create({
        questionIds: liveIds.map((a) => a.questionId),
        score,
        total: answers.length,
        state,
        category,
      }).catch((e) => console.warn("[quiz] failed to log attempt:", e.message));
    }

    res.json({ score, total: answers.length, results });
  } catch (err) {
    next(err);
  }
}

module.exports = { getQuiz, submitQuiz };
