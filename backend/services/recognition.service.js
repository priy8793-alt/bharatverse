/**
 * services/recognition.service.js
 * ----------------------------------
 * Backend art/craft recognition service.
 *
 * Architecture:
 *   image upload -> validate -> [VISION_API_KEY configured?]
 *      yes -> call the configured vision provider, then match its label
 *             against the Heritage collection for verified detail + sources
 *      no  -> DEMO MODE. We do NOT call Math.random() to fake a different
 *             "AI" answer on every click (that would misrepresent a
 *             prototype as working AI). Instead the demo path is a
 *             deterministic function of the uploaded file's own bytes
 *             (a hash), so the same image always maps to the same demo
 *             example — and the response is unambiguously labelled as a
 *             non-AI sample, not a real prediction.
 */

const crypto = require("crypto");
const Heritage = require("../models/Heritage");
const { isDbReady } = require("../config/db");

// A small, honestly-labelled set of example outputs used only in DEMO mode.
const DEMO_EXAMPLES = [
  {
    name: "Sohrai Art",
    state: "Jharkhand",
    region: "Hazaribagh, Jharkhand",
    category: "Tribal Art",
    history:
      "A tribal harvest-season wall painting tradition dating back generations, applied directly onto mud walls.",
    meaning: "Associated with harvest, fertility and nature-worship.",
    materials: "Natural ochre, chalk, charcoal and clay pigments.",
    technique: "Fingers, twigs and cloth swabs used to apply pigment onto a prepared mud surface.",
  },
  {
    name: "Madhubani Painting",
    state: "Bihar",
    region: "Mithila belt, Bihar",
    category: "Folk Painting",
    history: "Traditionally painted by women on mud walls and floors for festivals and weddings.",
    meaning: "Symbolises fertility, devotion and prosperity.",
    materials: "Natural dyes from turmeric, indigo and flower pigments.",
    technique: "Double-line borders drawn first, then filled edge-to-edge with intricate patterns.",
  },
  {
    name: "Warli Painting",
    state: "Maharashtra",
    region: "Palghar, Maharashtra",
    category: "Tribal Art",
    history: "A roughly 2,500-year-old tribal painting form using simple geometric shapes.",
    meaning: "Circles and triangles represent the sun, moon and mountains.",
    materials: "Rice paste on ochre-toned mud walls.",
    technique: "Painted with a bamboo stick dipped in white rice-paste paint.",
  },
  {
    name: "Pattachitra",
    state: "Odisha",
    region: "Raghurajpur, Odisha",
    category: "Scroll Painting",
    history: "A cloth-scroll painting tradition tied to the Jagannath temple.",
    meaning: "Depicts mythological narratives for temple ritual.",
    materials: "Tamarind glue, chalk-treated cloth, mineral pigments.",
    technique: "Cloth is treated, sketched, painted and lacquer-finished.",
  },
  {
    name: "Gond Painting",
    state: "Madhya Pradesh",
    region: "Bhopal, Madhya Pradesh",
    category: "Tribal Art",
    history: "A tribal art form built from dense dot-and-line patterning.",
    meaning: "Depicts nature, animals and folklore, believed to bring good fortune.",
    materials: "Natural and acrylic pigments.",
    technique: "Fine dots and dashes are layered to fill figurative outlines.",
  },
];

function deterministicIndex(buffer, modulo) {
  const hash = crypto.createHash("sha256").update(buffer).digest();
  const n = hash.readUInt32BE(0);
  return n % modulo;
}

async function attachRelatedHeritage(name, state) {
  if (!isDbReady()) return [];
  try {
    const matches = await Heritage.find({
      $or: [{ name: new RegExp(name, "i") }, { state }],
    })
      .limit(3)
      .select("_id name state category")
      .lean();
    return matches;
  } catch {
    return [];
  }
}

async function recognize({ buffer, mimetype }) {
  const liveConfigured = Boolean(process.env.VISION_PROVIDER && process.env.VISION_API_KEY);

  if (liveConfigured) {
    // Pluggable real-provider path. Not implemented in this prototype because
    // no vision credentials are configured in this environment — this is
    // where a real call (e.g. to a hosted vision/classification model) would
    // go. We intentionally do not stub it with fake success.
    const err = new Error(
      `VISION_PROVIDER "${process.env.VISION_PROVIDER}" is set but not implemented in this prototype build.`
    );
    err.status = 501;
    throw err;
  }

  // ---- DEMO MODE ----
  const idx = deterministicIndex(buffer, DEMO_EXAMPLES.length);
  const example = DEMO_EXAMPLES[idx];
  const relatedHeritage = await attachRelatedHeritage(example.name, example.state);

  return {
    prediction: example.name,
    confidence: null, // never fabricate a confidence number for a non-AI demo path
    state: example.state,
    region: example.region,
    category: example.category,
    history: example.history,
    meaning: example.meaning,
    materials: example.materials,
    technique: example.technique,
    sources: ["BharatVerse prototype dataset"],
    relatedHeritage,
    verificationStatus: "prototype",
    mode: "demo",
    notice:
      "AI recognition service is not configured. Running prototype mode: this result is a " +
      "deterministic sample tied to the uploaded file, not a real image analysis. Configure " +
      "VISION_PROVIDER and VISION_API_KEY to connect a real vision model.",
  };
}

function status() {
  const configured = Boolean(process.env.VISION_PROVIDER && process.env.VISION_API_KEY);
  return { configured, provider: process.env.VISION_PROVIDER || null, mode: configured ? "live" : "demo" };
}

module.exports = { recognize, status };
