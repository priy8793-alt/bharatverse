const Artisan = require("../models/Artisan");
const { isDbReady } = require("../config/db");

async function listArtisans(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const { state, craft } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (craft) filter.craft = new RegExp(craft, "i");
    const artisans = await Artisan.find(filter).sort({ createdAt: -1 });
    res.json({ count: artisans.length, artisans });
  } catch (err) {
    next(err);
  }
}

async function getArtisan(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const artisan = await Artisan.findById(req.params.id);
    if (!artisan) return res.status(404).json({ error: "Artisan not found." });
    res.json({ artisan });
  } catch (err) {
    next(err);
  }
}

/**
 * Prototype-safe "support" endpoint. Never processes a real payment —
 * stores an enquiry so a future production version has a real lead to
 * follow up with a marketplace/payment integration (explicitly future scope).
 */
async function supportArtisan(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const artisan = await Artisan.findById(req.params.id);
    if (!artisan) return res.status(404).json({ error: "Artisan not found." });
    const { name, email, message, amountInterest } = req.body;
    if (!email) return res.status(400).json({ error: "email is required to record support interest." });

    // In this prototype we don't have a separate Enquiry collection listed
    // in the spec, so we log to the server and echo back a confirmation —
    // a production build would persist this to its own collection.
    console.log("[support-enquiry]", {
      artisanId: artisan._id.toString(),
      name,
      email,
      message,
      amountInterest,
      at: new Date().toISOString(),
    });

    res.status(202).json({
      status: "recorded",
      mode: "demo",
      notice:
        "This prototype does not process real payments. Your interest has been recorded as an " +
        "enquiry. A production version would connect this to a real payment/marketplace flow " +
        "(future scope).",
    });
  } catch (err) {
    next(err);
  }
}

async function contactArtisan(req, res, next) {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "Database unavailable." });
    const artisan = await Artisan.findById(req.params.id);
    if (!artisan) return res.status(404).json({ error: "Artisan not found." });
    const { name, email, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: "email and message are required." });
    }
    console.log("[contact-enquiry]", {
      artisanId: artisan._id.toString(),
      name,
      email,
      message,
      at: new Date().toISOString(),
    });
    res.status(202).json({
      status: "recorded",
      mode: "demo",
      notice: "Your message has been recorded as a prototype enquiry — no real contact information is exposed.",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listArtisans, getArtisan, supportArtisan, contactArtisan };
