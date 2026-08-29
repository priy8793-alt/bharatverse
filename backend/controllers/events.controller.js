const Event = require("../models/Event");
const { isDbReady } = require("../config/db");

async function listEvents(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const { state, status, category } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (status) filter.status = status;
    if (category) filter.category = category;
    const events = await Event.find(filter).sort({ date: 1 });
    res.json({ count: events.length, events });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEvents };
