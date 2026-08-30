const Contribution = require("../models/Contribution");
const { isDbReady } = require("../config/db");
const { canTransitionContribution } = require("../services/verification.service");

async function createContribution(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });

    const { type, title, description, state } = req.body;
    if (!type || !title || !description || !state) {
      return res.status(400).json({ error: "type, title, description and state are required." });
    }

    const images = (req.files?.images || []).map((f) => `/uploads/${f.filename}`);
    const audio = req.files?.audio?.[0] ? `/uploads/${req.files.audio[0].filename}` : undefined;
    const video = req.files?.video?.[0] ? `/uploads/${req.files.video[0].filename}` : undefined;

    const contribution = await Contribution.create({
      ...req.body,
      images,
      audio,
      video,
      status: "pending",
    });

    res.status(201).json({
      contribution,
      notice:
        "Thank you — this submission is now Pending Verification. It will move through " +
        "review before being published on BharatVerse.",
    });
  } catch (err) {
    next(err);
  }
}

async function listContributions(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const { status, state } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (state) filter.state = state;
    const items = await Contribution.find(filter).sort({ createdAt: -1 });
    res.json({ count: items.length, items });
  } catch (err) {
    next(err);
  }
}

/** Verifier/admin-only: move a contribution through the review workflow. */
async function updateContributionStatus(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const { status, verificationNotes } = req.body;
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) return res.status(404).json({ error: "Contribution not found." });

    if (!canTransitionContribution(contribution.status, status)) {
      return res.status(400).json({
        error: `Cannot move a "${contribution.status}" contribution to "${status}".`,
      });
    }

    contribution.status = status;
    if (verificationNotes) contribution.verificationNotes = verificationNotes;
    await contribution.save();
    res.json({ contribution });
  } catch (err) {
    next(err);
  }
}

module.exports = { createContribution, listContributions, updateContributionStatus };
