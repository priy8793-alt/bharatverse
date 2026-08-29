const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.get("/me", protect(), ctrl.me);

module.exports = router;
