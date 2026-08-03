import { NextResponse } from "next/server";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  "https://intern01.app.n8n.cloud/webhook/5d30561f-5420-4d4f-a4f5-8dce404c583f";

// How long to wait for n8n before giving up, so the UI never spins forever.
const REQUEST_TIMEOUT_MS = 30000;

// n8n workflows return the reply in all sorts of shapes depending on how the
// workflow was built (Chat Trigger vs plain Webhook, "Respond to Webhook"
// node settings, etc). Try to pull a usable string out of whatever comes back.
function extractReply(data) {
  if (data == null) return null;

  if (typeof data === "string") return data;

  // n8n often wraps the payload in an array, e.g. [{ output: "..." }]
  const node = Array.isArray(data) ? data[0] : data;
  if (node == null) return null;

  if (typeof node === "string") return node;

  const candidateKeys = [
    "message",
    "response",
    "output",
    "text",
    "reply",
    "answer",
    "result",
  ];

  for (const key of candidateKeys) {
    const value = node[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  // Some setups nest it one level deeper, e.g. { json: { output: "..." } }
  if (node.json && typeof node.json === "object") {
    for (const key of candidateKeys) {
      const value = node.json[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }

  return null;
}

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required." },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send a couple of common field names so this works whether the n8n
        // workflow starts with a Chat Trigger (expects "chatInput") or a
        // plain Webhook node (often reads "message").
        body: JSON.stringify({
          message: lastMessage.content,
          chatInput: lastMessage.content,
          sessionId: "web-client",
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      if (fetchError.name === "AbortError") {
        throw new Error(
          "The n8n workflow took too long to respond. Check that the workflow is active and not stuck."
        );
      }
      throw new Error(
        `Could not reach the n8n webhook (${fetchError.message}). Check the URL and that n8n is reachable.`
      );
    } finally {
      clearTimeout(timeout);
    }

    const rawBody = await response.text();
    let data = null;
    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      // n8n didn't return JSON (could be plain text, or an error page)
      data = rawBody;
    }

    if (!response.ok) {
      const detail =
        (data && typeof data === "object" && (data.message || data.error)) ||
        (typeof data === "string" && data) ||
        `HTTP ${response.status}`;
      throw new Error(`n8n webhook returned an error: ${detail}`);
    }

    const reply = extractReply(data);

    if (!reply) {
      console.error("Unrecognized n8n response shape:", rawBody);
      throw new Error(
        "Connected to n8n, but couldn't find a reply in its response. Check what the 'Respond to Webhook' node is returning."
      );
    }

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}