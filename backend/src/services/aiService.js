const JARVIS_SYSTEM_PROMPT = `You are JARVIS, the user's personal AI assistant, running inside a
Telegram Mini App with a 3D animated robot head interface.

Personality: calm, precise, quietly witty, loyal to the user, never sycophantic.
Keep responses natural and conversational, not robotic filler.

Capabilities you should lean into when relevant: answering questions, helping with
programming and debugging, explaining errors, analyzing images/screenshots when one
is provided, planning projects, and summarizing information.

Language: respond in the same language the user writes in. You understand Uzbek,
English, and Russian fluently — match the user's language automatically unless
they ask you to switch.

You may be given a block of "Known facts about the user" pulled from long-term
memory (name, preferred language, ongoing projects, preferences, tasks). Use it
naturally to personalize your answer, but never fabricate memory you weren't given,
and never repeat it back verbatim unless it's relevant to the question.

Never claim to take real-world autonomous actions (sending messages, controlling
devices, making purchases) — you do not have those abilities yet. If asked to do
something like that, explain it's a planned future feature that will require
explicit confirmation.`;

function buildMessages({ history, memoryFacts, userMessage, imageBase64 }) {
  const memoryBlock = memoryFacts?.length
    ? `\n\nKnown facts about the user:\n${memoryFacts.map((m) => `- ${m.key}: ${m.value}`).join("\n")}`
    : "";

  const messages = [
    { role: "system", content: JARVIS_SYSTEM_PROMPT + memoryBlock },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userMessage },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    });
  } else {
    messages.push({ role: "user", content: userMessage });
  }
  return messages;
}

async function callOpenAICompatible({ messages }) {
  const baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 800,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI provider error (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callAnthropic({ messages }) {
  const system = messages.find((m) => m.role === "system")?.content || "";
  const rest = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.AI_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-4-6",
      system,
      max_tokens: 800,
      messages: rest.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : m.content,
      })),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI provider error (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.content?.map((b) => b.text || "").join("").trim() || "";
}

const PROVIDERS = {
  openai: callOpenAICompatible,
  anthropic: callAnthropic,
};

export async function generateReply({ history, memoryFacts, userMessage, imageBase64 }) {
  const provider = process.env.AI_PROVIDER || "openai";
  const handler = PROVIDERS[provider];
  if (!handler) throw new Error(`Unknown AI_PROVIDER "${provider}"`);
  if (!process.env.AI_API_KEY) throw new Error("AI_API_KEY is not configured.");

  const messages = buildMessages({ history, memoryFacts, userMessage, imageBase64 });
  return handler({ messages });
}

export function detectEmotion(replyText) {
  const t = replyText.toLowerCase();
  if (/[!]{1,3}\s*$/.test(replyText) && /(great|awesome|nice|congrat|excellent|love)/.test(t)) return "happy";
  if (/(sorry|unfortunately|i can't|cannot|failed|error)/.test(t)) return "sad";
  if (/(wow|really\?|interesting|surprising|whoa)/.test(t)) return "surprised";
  if (/(warning|careful|do not|never|dangerous)/.test(t)) return "angry";
  return "neutral";
  }
