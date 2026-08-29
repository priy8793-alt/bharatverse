const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/events.controller");

router.get("/", ctrl.listEvents);

module.exports = router;
