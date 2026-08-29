/**
 * services/verification.service.js
 * ----------------------------------
 * Shared verification-workflow helpers used by contributions, heritage
 * records, artisans and stories. Keeps the pending -> review -> verified
 * -> published lifecycle and the verification-status badges consistent
 * across the whole app.
 */

const CONTRIBUTION_STATES = ["pending", "review", "verified", "published", "rejected"];

const RECORD_VERIFICATION_STATES = [
  "pending",
  "community_verified",
  "institution_verified",
  "prototype",
];

const BADGES = {
  community_verified: { label: "Community Verified", icon: "✓" },
  institution_verified: { label: "Institution Verified", icon: "✓" },
  prototype: { label: "Prototype Data", icon: "⚠" },
  pending: { label: "Pending Verification", icon: "○" },
};

function badgeFor(status) {
  return BADGES[status] || BADGES.prototype;
}

/**
 * Validates a requested transition through the contribution lifecycle.
 * Only forward transitions (or a rejection from any non-terminal state)
 * are allowed, and only a verifier/admin should call this (enforced at
 * the route level with requireRole).
 */
function canTransitionContribution(current, next) {
  if (!CONTRIBUTION_STATES.includes(next)) return false;
  if (next === "rejected") return current !== "published" && current !== "rejected";
  const order = ["pending", "review", "verified", "published"];
  const curIdx = order.indexOf(current);
  const nextIdx = order.indexOf(next);
  if (curIdx === -1 || nextIdx === -1) return false;
  return nextIdx === curIdx + 1 || nextIdx === curIdx; // allow staying or moving one step forward
}

const METHODOLOGY_TEXT = `
Sources & Methodology

Data origin: BharatVerse prototype data comes from three places —
(1) hand-curated seed data written for this prototype and clearly
labelled "Prototype Dataset", (2) community submissions made through
"Add Your Heritage", and (3) — in a future production version —
verified institutional partners (state tourism/culture departments,
museums, craft councils).

Verification process: every record carries a verificationStatus field:
  - prototype: seed/demo content written for this hackathon prototype.
  - pending: submitted by a community member, not yet reviewed.
  - community_verified: cross-checked by other community members or
    moderators against at least one public source.
  - institution_verified: confirmed by a named cultural institution or
    government body (not implemented in this prototype — future scope).

Prototype limitations: this build does not have a live connection to
any government heritage database. Confidence scores from the AI
recognition module and Heritage Health scores are prototype estimates
based on the indicators described in the README, not certified figures.

Future institutional verification: a production version would let
verified institutional accounts (ASI, state culture departments,
craft councils, universities) claim and institution-verify records,
replacing "Prototype Data" badges with "Institution Verified" ones.
`.trim();

module.exports = {
  CONTRIBUTION_STATES,
  RECORD_VERIFICATION_STATES,
  badgeFor,
  canTransitionContribution,
  METHODOLOGY_TEXT,
};
