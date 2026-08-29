const Heritage = require("../models/Heritage");
const Artisan = require("../models/Artisan");
const State = require("../models/State");
const Contribution = require("../models/Contribution");
const { isDbReady } = require("../config/db");

async function getDashboard(req, res, next) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({
        error: "Database unavailable — dashboard metrics cannot be computed right now.",
      });
    }

    const [
      totalHeritage,
      digitizedAssets,
      artisanProfiles,
      statesCovered,
      communityContributions,
      verifiedRecords,
      vulnerableTraditions,
      atRiskTraditions,
      recentRecords,
      healthBuckets,
    ] = await Promise.all([
      Heritage.countDocuments(),
      Heritage.countDocuments({ images: { $exists: true, $not: { $size: 0 } } }),
      Artisan.countDocuments(),
      State.countDocuments(),
      Contribution.countDocuments(),
      Heritage.countDocuments({
        verificationStatus: { $in: ["community_verified", "institution_verified"] },
      }),
      Heritage.countDocuments({ healthStatus: "vulnerable" }),
      Heritage.countDocuments({ healthStatus: "at_risk" }),
      Heritage.find().sort({ createdAt: -1 }).limit(6).select("name state category healthStatus"),
      Heritage.aggregate([{ $group: { _id: "$healthStatus", count: { $sum: 1 } } }]),
    ]);

    const healthDistribution = { stable: 0, vulnerable: 0, at_risk: 0, unassessed: 0 };
    healthBuckets.forEach((b) => {
      if (b._id && healthDistribution[b._id] !== undefined) healthDistribution[b._id] = b.count;
    });

    res.json({
      totalHeritage,
      digitizedAssets,
      artisanProfiles,
      statesCovered,
      communityContributions,
      verifiedRecords,
      vulnerableTraditions,
      atRiskTraditions,
      recentRecords,
      healthDistribution,
      datasetLabel: "Prototype Dataset",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
