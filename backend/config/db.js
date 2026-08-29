const mongoose = require("mongoose");

let cachedState = "disconnected"; // disconnected | connecting | connected | error

/**
 * Connects to MongoDB using MONGO_URI. The rest of the app is designed to
 * keep running (in a degraded, clearly-labelled "Demo Mode") even if this
 * fails, so we never process.exit() here — we just log and let routes
 * report DB status honestly via /api/health.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("[db] MONGO_URI not set — running without a database connection.");
    cachedState = "error";
    return;
  }
  try {
    cachedState = "connecting";
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SELECTION_TIMEOUT_MS) || 8000,
    });
    cachedState = "connected";
    console.log("[db] MongoDB connected:", mongoose.connection.host);

    mongoose.connection.on("disconnected", () => {
      cachedState = "disconnected";
      console.warn("[db] MongoDB disconnected");
    });
    mongoose.connection.on("error", (err) => {
      cachedState = "error";
      console.error("[db] MongoDB error:", err.message);
    });
  } catch (err) {
    cachedState = "error";
    console.error("[db] MongoDB connection failed:", err.message);
    console.error("[db] The API will continue running. Endpoints that need the");
    console.error("[db] database will return a clear 'database unavailable' error");
    console.error("[db] instead of silently faking data.");
  }
}

function dbState() {
  return cachedState;
}

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, dbState, isDbReady };
