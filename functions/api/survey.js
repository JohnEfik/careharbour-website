// Cloudflare Pages Function: POST /api/survey
// Receives the anonymous post-simulation survey. Bind a KV namespace named
// SURVEYS to keep results; without one, responses are accepted and dropped.

const ALLOWED = ["anonymousId", "condition", "band", "format", "choseResources", "helpful", "ease", "relevant", "recommend", "comment", "submittedAt"];

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const entry = Object.fromEntries(
    ALLOWED.filter((k) => body[k] !== undefined).map((k) => [k, String(body[k]).slice(0, 500)])
  );
  if (!/^CH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(entry.anonymousId || "")) {
    return new Response("Missing anonymous ID", { status: 400 });
  }
  if (env.SURVEYS) {
    await env.SURVEYS.put(`${new Date().toISOString()}:${entry.anonymousId}`, JSON.stringify(entry));
  }
  return new Response(null, { status: 204 });
}
