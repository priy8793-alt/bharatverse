const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/quiz.controller");

router.get("/", ctrl.getQuiz);
router.post("/submit", ctrl.submitQuiz);

module.exports = router;
