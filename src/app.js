const express = require("express");
const cors = require("cors");
const path = require("path");

const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const flashRoutes = require("./routes/flashRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  const authCookie = req.headers.cookie || "";
  const hasAuthCookie = authCookie
    .split(";")
    .map((item) => item.trim())
    .some((item) => item.startsWith("bettyAuthToken="));

  if (!hasAuthCookie) {
    return res.redirect("/public/pages/login.html");
  }

  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/flashes", flashRoutes);
app.use("/api/uploads", uploadRoutes);

app.use((err, req, res, next) => {
  if (err && err.message) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
