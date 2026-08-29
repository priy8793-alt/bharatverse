const Heritage = require("../models/Heritage");
const State = require("../models/State");
const Artisan = require("../models/Artisan");
const Event = require("../models/Event");
const Story = require("../models/Story");
const { isDbReady } = require("../config/db");

async function unifiedSearch(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ query: q, results: {} });

    const { state, category, language, healthStatus, verificationStatus } = req.query;

    const heritageFilter = { $text: { $search: q } };
    if (state) heritageFilter.state = state;
    if (category) heritageFilter.category = category;
    if (healthStatus) heritageFilter.healthStatus = healthStatus;
    if (verificationStatus) heritageFilter.verificationStatus = verificationStatus;
    if (language) heritageFilter.languages = language;

    const [heritage, states, artisans, events, stories] = await Promise.all([
      Heritage.find(heritageFilter).limit(15),
      State.find({ $text: { $search: q } }).limit(6),
      Artisan.find({ $text: { $search: q } }).limit(8),
      Event.find({ $text: { $search: q } }).limit(8),
      Story.find({ $text: { $search: q } }).limit(8),
    ]);

    res.json({
      query: q,
      results: { heritage, states, artisans, events, stories },
      totalResults: heritage.length + states.length + artisans.length + events.length + stories.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { unifiedSearch };
