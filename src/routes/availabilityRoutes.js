const express = require("express");

const {
  listAvailability,
  addAvailability,
  updateAvailabilitySlots,
  removeAvailability,
} = require("../controllers/availabilityController");
const { requireAuth, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

router.get("/", listAvailability);
router.post("/", requireAuth, requireAdmin, addAvailability);
router.patch(
  "/:date/slots",
  requireAuth,
  requireAdmin,
  updateAvailabilitySlots,
);
router.delete("/:date", requireAuth, requireAdmin, removeAvailability);

module.exports = router;
