const Story = require("../models/Story");
const { isDbReady } = require("../config/db");

async function listStories(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const { state, language } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (language) filter.language = language;
    const stories = await Story.find(filter).sort({ createdAt: -1 });
    res.json({ count: stories.length, stories });
  } catch (err) {
    next(err);
  }
}

module.exports = { listStories };
