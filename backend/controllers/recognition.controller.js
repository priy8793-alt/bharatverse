const fs = require("fs");
const recognitionService = require("../services/recognition.service");
const Recognition = require("../models/Recognition");
const { isDbReady } = require("../config/db");

async function recognizeImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "An `image` file is required (multipart/form-data)." });
    }

    const buffer = fs.readFileSync(req.file.path);
    const result = await recognitionService.recognize({ buffer, mimetype: req.file.mimetype });

    const imageUrl = `/uploads/${req.file.filename}`;

    if (isDbReady()) {
      await Recognition.create({
        imageUrl,
        predictedArt: result.prediction,
        state: result.state,
        region: result.region,
        category: result.category,
        confidence: result.confidence,
        analysis: {
          history: result.history,
          meaning: result.meaning,
          materials: result.materials,
          technique: result.technique,
        },
        relatedHeritage: (result.relatedHeritage || []).map((h) => h._id),
        sources: result.sources,
        verificationStatus: result.verificationStatus,
        model: result.mode === "live" ? process.env.VISION_PROVIDER : "demo",
        mode: result.mode,
      }).catch((e) => console.warn("[recognition] failed to log to DB:", e.message));
    }

    res.json({ ...result, imageUrl });
  } catch (err) {
    next(err);
  }
}

function recognitionStatus(req, res) {
  res.json(recognitionService.status());
}

module.exports = { recognizeImage, recognitionStatus };
