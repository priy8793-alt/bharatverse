const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/artisans.controller");

router.get("/", ctrl.listArtisans);
router.get("/:id", ctrl.getArtisan);
router.post("/:id/support", ctrl.supportArtisan);
router.post("/:id/contact", ctrl.contactArtisan);

module.exports = router;
