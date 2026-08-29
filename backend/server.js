require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const { connectDB, dbState } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const statesRoutes = require("./routes/states.routes");
const heritageRoutes = require("./routes/heritage.routes");
const artisansRoutes = require("./routes/artisans.routes");
const eventsRoutes = require("./routes/events.routes");
const storiesRoutes = require("./routes/stories.routes");
const contributionsRoutes = require("./routes/contributions.routes");
const recognitionRoutes = require("./routes/recognition.routes");
const aiRoutes = require("./routes/ai.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const searchRoutes = require("./routes/search.routes");
const quizRoutes = require("./routes/quiz.routes");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Serve locally-uploaded images/audio (used when Cloudinary isn't configured)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: dbState(),
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/states", statesRoutes);
app.use("/api/heritage", heritageRoutes);
app.use("/api/artisans", artisansRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/contributions", contributionsRoutes);
app.use("/api/recognition", recognitionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/quiz", quizRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`\n  BharatVerse backend running on http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health\n`);
  });
});

module.exports = app;
