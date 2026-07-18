const express = require("express");

const upload = require("../middlewares/upload");
const {
  uploadFrontendImage,
  uploadPublicationImage,
  uploadClientReferenceImage,
  deleteImage,
} = require("../controllers/uploadController");

const router = express.Router();

router.post("/frontend", upload.single("image"), uploadFrontendImage);
router.post("/publicaciones", upload.single("image"), uploadPublicationImage);
router.post(
  "/referencias-clientes",
  upload.single("image"),
  uploadClientReferenceImage,
);
router.delete("/", deleteImage);

module.exports = router;
