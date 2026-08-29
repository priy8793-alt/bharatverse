const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/stories.controller");

router.get("/", ctrl.listStories);

module.exports = router;
