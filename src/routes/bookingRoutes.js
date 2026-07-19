const express = require("express");

const {
  createBooking,
  listMyBookings,
  listBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");
const { requireAuth, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/", requireAuth, createBooking);
router.get("/me", requireAuth, listMyBookings);
router.get("/", requireAuth, requireAdmin, listBookings);
router.patch("/:id/status", requireAuth, requireAdmin, updateBookingStatus);

module.exports = router;
