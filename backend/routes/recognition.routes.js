const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/recognition.controller");
const { upload } = require("../middleware/upload");

router.get("/status", ctrl.recognitionStatus);
router.post("/", upload.single("image"), ctrl.recognizeImage);

module.exports = router;
