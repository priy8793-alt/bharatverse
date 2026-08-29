/**
 * services/heritageRisk.service.js
 * ---------------------------------
 * Transparent, documented Heritage Health scoring engine.
 *
 * This is a PROTOTYPE assessment tool, not an official government
 * certification. Every score it produces is explainable: it is a
 * weighted average of six 0-100 indicators supplied by whoever is
 * documenting a tradition (a contributor, a verifier, or seed data).
 *
 * Weights (documented here and in README.md "Heritage Health methodology"):
 *   documentation        : 15%
 *   practitionerBase      : 20%
 *   youthParticipation     : 20%
 *   practiceFrequency      : 15%
 *   economicViability       : 15%
 *   communityParticipation   : 15%
 *
 * Status thresholds:
 *   score >= 70            -> stable        (GREEN)
 *   40 <= score < 70        -> vulnerable     (YELLOW)
 *   score < 40              -> at_risk         (RED)
 */

const WEIGHTS = {
  documentation: 0.15,
  practitionerBase: 0.2,
  youthParticipation: 0.2,
  practiceFrequency: 0.15,
  economicViability: 0.15,
  communityParticipation: 0.15,
};

const THRESHOLDS = { stable: 70, vulnerable: 40 };

function clamp(n, min = 0, max = 100) {
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {Object} data - raw indicator values (0-100), any subset allowed.
 * @returns {{score:number, status:string, indicators:Object, explanation:string, methodology:string}}
 */
function calculateHeritageHealth(data = {}) {
  const indicators = {};
  let weightedSum = 0;
  let weightUsed = 0;
  const missing = [];

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const raw = clamp(data[key]);
    if (raw === null) {
      missing.push(key);
      continue;
    }
    indicators[key] = raw;
    weightedSum += raw * weight;
    weightUsed += weight;
  }

  if (weightUsed === 0) {
    return {
      score: null,
      status: "unassessed",
      indicators: {},
      explanation:
        "No indicators were supplied, so no Heritage Health score could be calculated.",
      methodology: methodologyText(),
    };
  }

  // Re-normalize against whatever indicators were actually supplied, so a
  // partially-documented tradition still gets a fair score instead of being
  // punished for missing fields.
  const score = Math.round(weightedSum / weightUsed);

  let status;
  if (score >= THRESHOLDS.stable) status = "stable";
  else if (score >= THRESHOLDS.vulnerable) status = "vulnerable";
  else status = "at_risk";

  const explanation = buildExplanation(indicators, score, status, missing);

  return { score, status, indicators, explanation, methodology: methodologyText() };
}

function buildExplanation(indicators, score, status, missing) {
  const label = { stable: "Stable", vulnerable: "Vulnerable", at_risk: "At Risk" }[status];
  const lowest = Object.entries(indicators).sort((a, b) => a[1] - b[1])[0];
  let text = `Prototype assessment based on defined indicators. Overall score ${score}/100 (${label}).`;
  if (lowest) {
    text += ` The weakest signal is ${humanize(lowest[0])} at ${lowest[1]}/100.`;
  }
  if (missing.length) {
    text += ` Not yet documented: ${missing.map(humanize).join(", ")}.`;
  }
  return text;
}

function humanize(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function methodologyText() {
  return (
    "Heritage Health is a prototype composite score (not an official government " +
    "assessment) built from six weighted 0-100 indicators: Documentation (15%), " +
    "Practitioner Base (20%), Youth Participation (20%), Practice Frequency (15%), " +
    "Economic Viability (15%) and Community Participation (15%). Scores of 70+ are " +
    "labelled Stable, 40-69 Vulnerable, below 40 At Risk. See README.md for full methodology."
  );
}

module.exports = { calculateHeritageHealth, WEIGHTS, THRESHOLDS, methodologyText };
