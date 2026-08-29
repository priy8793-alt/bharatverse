const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/heritage.controller");
const { protect, requireRole } = require("../middleware/auth");

router.get("/search", ctrl.searchHeritage);
router.get("/", ctrl.listHeritage);
router.get("/:id", ctrl.getHeritage);
router.post("/", protect(), requireRole("verifier", "admin"), ctrl.createHeritage);
router.post("/:id/recompute-health", protect(), requireRole("verifier", "admin"), ctrl.recomputeHealth);

module.exports = router;
