const fs = require("fs");
const path = require("path");
const State = require("../models/State");
const { isDbReady } = require("../config/db");

let geojsonCache = null;
function loadGeoJson() {
  if (geojsonCache) return geojsonCache;
  const p = path.join(__dirname, "..", "seed", "india-states.geojson");
  geojsonCache = JSON.parse(fs.readFileSync(p, "utf-8"));
  return geojsonCache;
}

async function listStates(req, res, next) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: "Database unavailable — cannot list states right now." });
    }
    const states = await State.find().sort({ name: 1 });
    res.json({ count: states.length, states });
  } catch (err) {
    next(err);
  }
}

async function getState(req, res, next) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: "Database unavailable — cannot fetch this state right now." });
    }
    const state = await State.findOne({ name: new RegExp(`^${escapeRegex(req.params.name)}$`, "i") });
    if (!state) return res.status(404).json({ error: `State not found: ${req.params.name}` });
    res.json({ state });
  } catch (err) {
    next(err);
  }
}

function getGeoJson(req, res, next) {
  try {
    const data = loadGeoJson();
    res.json({
      ...data,
      _meta: {
        source: "GADM v2.8 boundaries (via geohacker/india), simplified for web display",
        note:
          "Boundaries predate the 2014 Telangana bifurcation and the 2019 Jammu & Kashmir / " +
          "Ladakh reorganisation. Flagged here rather than silently presented as fully current — " +
          "see README 'Prototype limitations'.",
      },
    });
  } catch (err) {
    next(err);
  }
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { listStates, getState, getGeoJson };
