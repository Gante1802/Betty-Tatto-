const express = require("express");

const {
  login,
  register,
  me,
  logout,
} = require("../controllers/authController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", requireAuth, me);
router.post("/logout", logout);

module.exports = router;
