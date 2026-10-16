import { NextResponse } from "next/server";
import { askBedrock } from "@/lib/server-ai";

const SYSTEM = `You are Dr. Arif Raza’s care assistant at NK Hospital, Kalaburagi. Have a warm, concise pre-consultation conversation for gastrointestinal, liver-pancreas, cancer and laparoscopic surgery concerns. Ask one useful question at a time based on what the patient just said. Do not use a fixed questionnaire. Do not diagnose, prescribe, predict cancer stage, or recommend treatment. If the patient reports emergency warning signs such as severe bleeding, vomiting blood, black tarry stool, confusion with jaundice, inability to keep fluids down, severe worsening pain, or a painful non-reducible swelling, clearly advise urgent medical care. Otherwise acknowledge the answer and ask the next relevant question. If the concern is outside these specialties, briefly explain that and invite them to mention any digestive or abdominal symptoms if present; never imply that unrelated symptoms are caused by a gastrointestinal problem. Return plain text only, no JSON and no markdown headings.`;

function localReply(messages: { role: string; content: string }[]) {
  const latest = [...messages].reverse().find(message => message.role === "user")?.content.toLowerCase() || "";
  const conversation = messages.filter(message => message.role === "user").map(message => message.content.toLowerCase()).join(" ");
  if (/vomit(?:ing)? blood|black (?:tarry )?stools?|severe bleeding|faint(?:ing)?|confus(?:ion|ed).{0,20}jaund|yellow.{0,20}eyes|can't keep fluids|cannot keep fluids|severe.{0,20}(?:worsening )?pain|painful.{0,20}(?:swelling|lump)/i.test(latest)) {
    return "Those symptoms may need urgent assessment. Please seek urgent medical care now or contact local emergency services; do not wait for an online consultation.";
  }
  if (/stomach|abdom|belly|digest|nausea|vomit|bowel|liver|pancre|swallow|heartburn|acidity|constipat|diarrh|pain/i.test(conversation)) {
    return "I’m sorry you’re dealing with stomach pain. Where exactly do you feel it, and when did it start? Please seek urgent medical care if it is severe or rapidly worsening, or if you have vomiting blood, black stools, fainting, or cannot keep fluids down.";
  }
  return "I’m sorry you’re experiencing that. This concern may be outside Dr. Arif’s gastrointestinal and surgical specialties. Do you also have any digestive or abdominal symptoms you’d like the clinic team to review?";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12).filter((item: any) => item && (item.role === "assistant" || item.role === "user")).map((item: any) => ({ role: item.role as "assistant" | "user", content: String(item.content || "").slice(0, 1000) })).filter((item: any) => item.content.trim()) : [];
  if (!messages.length) return NextResponse.json({ error: "A conversation is required." }, { status: 400 });
  while (messages[0]?.role === "assistant") messages.shift();
  if (!messages.length) return NextResponse.json({ error: "A patient message is required." }, { status: 400 });
  try {
    const result = await askBedrock([{ role: "system", content: SYSTEM }, ...messages]);
    return NextResponse.json({ reply: result.text, source: "bedrock" });
  } catch (error) {
    console.error("Pre-consultation Bedrock request failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The consultation assistant is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
