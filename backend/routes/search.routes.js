const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/search.controller");

router.get("/", ctrl.unifiedSearch);

module.exports = router;
