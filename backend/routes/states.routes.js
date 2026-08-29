const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/states.controller");

// NOTE: /geojson must be declared before /:name so it isn't swallowed by the param route.
router.get("/geojson", ctrl.getGeoJson);
router.get("/", ctrl.listStates);
router.get("/:name", ctrl.getState);

module.exports = router;
