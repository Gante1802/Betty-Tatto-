const express = require("express");

const upload = require("../middlewares/upload");
const { requireAuth, requireAdmin } = require("../middlewares/auth");
const {
  uploadFrontendImage,
  uploadPublicationImage,
  uploadClientReferenceImage,
  deleteImage,
} = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/frontend",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  uploadFrontendImage,
);
router.post(
  "/publicaciones",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  uploadPublicationImage,
);
router.post(
  "/referencias-clientes",
  requireAuth,
  upload.single("image"),
  uploadClientReferenceImage,
);
router.delete("/", requireAuth, requireAdmin, deleteImage);

module.exports = router;
