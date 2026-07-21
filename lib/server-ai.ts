type ChatMessage = { role: "system" | "user"; content: string };

const providers = [
  { name: "cerebras", key: process.env.CEREBRAS_API_KEY, url: "https://api.cerebras.ai/v1/chat/completions", model: process.env.CEREBRAS_MODEL || "llama-3.3-70b" },
  { name: "groq", key: process.env.GROQ_API_KEY, url: "https://api.groq.com/openai/v1/chat/completions", model: process.env.GROQ_MODEL || "llama-3.1-8b-instant" },
  { name: "openrouter", key: process.env.OPENROUTER_API_KEY, url: "https://openrouter.ai/api/v1/chat/completions", model: process.env.OPENROUTER_MODEL || "openrouter/free" },
];

async function requestOpenAI(provider: typeof providers[number], messages: ChatMessage[], json: boolean) {
  if (!provider.key) return null;
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(provider.url, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.key}` }, body: JSON.stringify({ model: provider.model, messages, temperature: 0, max_tokens: 500, ...(json ? { response_format: { type: "json_object" } } : {}) }) });
    if (!response.ok) return null;
    const data = await response.json(); const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? { text: text.trim(), provider: provider.name } : null;
  } catch { return null; } finally { clearTimeout(timeout); }
}

async function requestGemini(messages: ChatMessage[], json: boolean) {
  const key = process.env.GEMINI_API_KEY; if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const prompt = messages.map(message => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 500, ...(json ? { responseMimeType: "application/json" } : {}) } }) });
    if (!response.ok) return null; const data = await response.json(); const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("");
    return typeof text === "string" && text.trim() ? { text: text.trim(), provider: "gemini" } : null;
  } catch { return null; } finally { clearTimeout(timeout); }
}

export async function askProviders(messages: ChatMessage[], json = false) {
  for (const provider of providers) { const result = await requestOpenAI(provider, messages, json); if (result) return result; }
  return requestGemini(messages, json);
}
