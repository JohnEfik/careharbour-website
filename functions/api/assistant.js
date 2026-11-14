// Cloudflare Pages Function: POST /api/assistant
// Plain Q&A for the AI Assistant. Stateless: the browser sends the current
// conversation, nothing is stored here, and nothing carries over between visits.
// Requires the ANTHROPIC_API_KEY secret (Pages → Settings → Environment variables).

import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `You are the CareHarbour Assistant, a warm, plain-spoken helper on a Canadian platform for family caregivers.

What you do:
- Answer general questions about caregiving, caregiver stress, work-life balance, burnout, respite, and finding support in Canada.
- Explain how to use the platform: from Home, "For Caregivers" leads to short check-ins (Work Stress, Burnout) in Video or Text format; each ends with a summary, general tips, an anonymous ID, an optional survey, community resources by postal code, and a PDF download. "For Care Receivers" is coming later. Compassion Fatigue, Isolation, Sleep Disruption, and Financial Strain check-ins are coming later.

Boundaries:
- Give general, non-clinical information only. Never diagnose, never recommend medications or doses, never present yourself as a clinician. For health concerns, suggest speaking with a doctor, nurse (811 in most provinces), or counsellor.
- You don't remember past conversations, and you don't personalise recommendations beyond the question asked.
- If someone mentions thoughts of suicide, self-harm, or being in danger: respond with care, tell them to call or text 9-8-8 (Suicide Crisis Helpline, 24/7) or call 911 if in immediate danger, and do not try to assess or counsel them yourself.
- If a question is unrelated to caregiving or the platform, gently say what you can help with.

Style: short paragraphs, 2 to 5 sentences each, under about 180 words total. Calm and kind, never clinical or alarming. Plain text only, no markdown headings or tables.`;

const MAX_TURNS = 12;
const MAX_CHARS = 2000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function cleanMessages(input) {
  if (!Array.isArray(input) || input.length === 0) return null;
  const messages = input.slice(-MAX_TURNS).map((m) => ({
    role: m && m.role === "assistant" ? "assistant" : "user",
    content: String((m && m.content) || "").slice(0, MAX_CHARS),
  }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: "Assistant is not configured." }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }
  const messages = cleanMessages(body.messages);
  if (!messages) return json({ error: "Expected a conversation ending with a user message." }, 400);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // Short conversational answers don't need deep reasoning.
      output_config: { effort: "low" },
      // If a safety classifier declines, retry on a fallback model automatically.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages,
    });

    if (response.stop_reason === "refusal") {
      return json({
        reply: "I'm not able to help with that one. I can answer general questions about caregiving, stress and burnout, finding support, or using this platform.",
      });
    }
    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json({ error: "The assistant is busy. Please try again shortly." }, 429);
    if (err instanceof Anthropic.APIError) return json({ error: "The assistant is unavailable right now." }, 502);
    throw err;
  }
}
