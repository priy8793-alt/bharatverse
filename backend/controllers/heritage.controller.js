const Heritage = require("../models/Heritage");
const { isDbReady } = require("../config/db");
const { calculateHeritageHealth } = require("../services/heritageRisk.service");

async function listHeritage(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const { state, category, healthStatus, verificationStatus, page = 1, limit = 24 } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (category) filter.category = category;
    if (healthStatus) filter.healthStatus = healthStatus;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));

    const [items, total] = await Promise.all([
      Heritage.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Heritage.countDocuments(filter),
    ]);

    res.json({ total, page: pageNum, limit: limitNum, items });
  } catch (err) {
    next(err);
  }
}

async function getHeritage(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const item = await Heritage.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Heritage record not found." });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

async function searchHeritage(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ query: q, items: [] });
    const items = await Heritage.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(30);
    res.json({ query: q, count: items.length, items });
  } catch (err) {
    next(err);
  }
}

async function createHeritage(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const payload = req.body;
    if (payload.healthIndicators) {
      const health = calculateHeritageHealth(payload.healthIndicators);
      payload.healthScore = health.score;
      payload.healthStatus = health.status;
      payload.healthExplanation = health.explanation;
    }
    const item = await Heritage.create(payload);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

/** Recomputes health for an existing record from its stored indicators. */
async function recomputeHealth(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const item = await Heritage.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Heritage record not found." });
    const health = calculateHeritageHealth(item.healthIndicators || {});
    item.healthScore = health.score;
    item.healthStatus = health.status;
    item.healthExplanation = health.explanation;
    await item.save();
    res.json({ item, health });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHeritage, getHeritage, searchHeritage, createHeritage, recomputeHealth };
