const express = require("express");

const {
  listFlashes,
  createFlash,
  updateFlash,
  deleteFlash,
} = require("../controllers/flashController");
const { requireAuth, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

router.get("/", listFlashes);
router.post("/", requireAuth, requireAdmin, createFlash);
router.put("/:id", requireAuth, requireAdmin, updateFlash);
router.delete("/:id", requireAuth, requireAdmin, deleteFlash);

module.exports = router;
