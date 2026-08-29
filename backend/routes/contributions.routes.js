const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/contributions.controller");
const { upload } = require("../middleware/upload");
const { protect, requireRole } = require("../middleware/auth");

router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "audio", maxCount: 1 },
  ]),
  ctrl.createContribution
);
router.get("/", ctrl.listContributions);
router.patch("/:id/status", protect(), requireRole("verifier", "admin"), ctrl.updateContributionStatus);

module.exports = router;
