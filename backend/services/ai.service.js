/**
 * services/ai.service.js
 * ------------------------
 * Backend-only AI service for Bharat AI. The frontend NEVER calls an AI
 * provider directly and NEVER holds an API key — it only calls
 * POST /api/ai/chat on this backend.
 *
 * Flow:
 *   validate request
 *     -> search MongoDB (Heritage + State collections) for relevant,
 *        verified records ("RAG" retrieval step)
 *     -> build a grounded context string from those records
 *     -> if AI_API_KEY is configured, send the context + question to the
 *        configured model and return its answer
 *     -> if no AI_API_KEY is configured, DO NOT fake a live model. Return
 *        a DEMO-mode answer built directly from the retrieved records,
 *        clearly labelled as such.
 */

const Heritage = require("../models/Heritage");
const State = require("../models/State");
const { isDbReady } = require("../config/db");

const SYSTEM_PROMPT = `You are Bharat AI, the cultural guide inside BharatVerse, a platform
documenting India's living heritage, art, dance, festivals and artisan communities.
Answer using ONLY the CONTEXT provided below, which was retrieved from BharatVerse's
verified cultural database. If the context does not contain the answer, say so honestly
instead of inventing facts. Keep answers warm, concise (2-5 sentences), and cite which
records you used by name. Never claim to browse the live web.`;

async function retrieveContext(message) {
  if (!isDbReady()) return { records: [], usedDb: false };

  const query = message.trim();
  if (!query) return { records: [], usedDb: true };

  const [heritageHits, stateHits] = await Promise.all([
    Heritage.find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(4)
      .lean()
      .catch(() => []),
    State.find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(2)
      .lean()
      .catch(() => []),
  ]);

  const records = [
    ...heritageHits.map((h) => ({
      type: "Heritage",
      id: h._id,
      name: h.name,
      summary: h.description || h.significance || h.history || "",
      state: h.state,
      verificationStatus: h.verificationStatus,
    })),
    ...stateHits.map((s) => ({
      type: "State",
      id: s._id,
      name: s.name,
      summary: s.highlights,
      state: s.name,
      verificationStatus: s.verificationStatus,
    })),
  ];

  return { records, usedDb: true };
}

function buildContextBlock(records) {
  if (!records.length) return "No matching verified records were found in the database.";
  return records
    .map(
      (r, i) =>
        `[${i + 1}] (${r.type}) ${r.name} — ${r.state || ""}\n${r.summary || "No description on file."}\nVerification: ${r.verificationStatus}`
    )
    .join("\n\n");
}

async function callLiveModel({ message, language, contextBlock }) {
  const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI_API_KEY not configured");

  if (provider === "anthropic") {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "claude-sonnet-4-6",
        max_tokens: 400,
        system: `${SYSTEM_PROMPT}${language ? ` Reply in ${language}.` : ""}\n\nCONTEXT:\n${contextBlock}`,
        messages: [{ role: "user", content: message }],
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Live model request failed (${resp.status}): ${body.slice(0, 200)}`);
    }
    const data = await resp.json();
    const text = (data.content || []).map((b) => b.text || "").join("\n").trim();
    if (!text) throw new Error("Live model returned an empty response");
    return text;
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}

function demoAnswer({ message, language, records }) {
  if (!records.length) {
    return {
      text:
        "I don't have a verified record matching that yet in this prototype's database. " +
        "Try asking about a specific art form, dance, festival or state — for example " +
        `"Tell me about Sohrai Art" or "Festivals in Odisha".` +
        (language && language !== "English"
          ? ` (Full ${language} responses require a configured live AI model — this is a DEMO mode reply.)`
          : ""),
      basedOn: [],
    };
  }
  const top = records[0];
  let text = `${top.name}${top.state ? ` (${top.state})` : ""}: ${
    top.summary || "No further detail is documented for this record yet."
  }`;
  if (records.length > 1) {
    text += ` Related: ${records
      .slice(1)
      .map((r) => r.name)
      .join(", ")}.`;
  }
  text += " (DEMO mode reply, built directly from BharatVerse's database — no live model is configured.)";
  return { text, basedOn: records.map((r) => r.name) };
}

/**
 * @param {{message:string, language?:string}} input
 * @returns {Promise<{answer:string, language:string, sources:string[], verificationStatus:string, relatedHeritage:any[], mode:'live'|'demo'}>}
 */
async function chat({ message, language = "English" }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    const err = new Error("`message` is required");
    err.status = 400;
    throw err;
  }

  const { records } = await retrieveContext(message);
  const contextBlock = buildContextBlock(records);
  const sources = records.map((r) => r.name);
  const relatedHeritage = records.filter((r) => r.type === "Heritage").map((r) => r.id);

  try {
    const liveText = await callLiveModel({ message, language, contextBlock });
    return {
      answer: liveText,
      language,
      sources,
      verificationStatus: records.length ? "community_verified" : "prototype",
      relatedHeritage,
      mode: "live",
    };
  } catch (err) {
    // Never silently pretend to be live — fall back to an honest DEMO reply
    // grounded in whatever verified records were actually retrieved.
    const demo = demoAnswer({ message, language, records });
    return {
      answer: demo.text,
      language,
      sources: demo.basedOn,
      verificationStatus: records.length ? "community_verified" : "prototype",
      relatedHeritage,
      mode: "demo",
    };
  }
}

function status() {
  return {
    configured: Boolean(process.env.AI_API_KEY),
    provider: process.env.AI_PROVIDER || "anthropic",
    mode: process.env.AI_API_KEY ? "live" : "demo",
  };
}

module.exports = { chat, status };
