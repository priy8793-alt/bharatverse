const aiService = require("../services/ai.service");

async function chat(req, res, next) {
  try {
    const { message, language } = req.body;
    const result = await aiService.chat({ message, language });
    res.json(result);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
}

function aiStatus(req, res) {
  res.json(aiService.status());
}

module.exports = { chat, aiStatus };
