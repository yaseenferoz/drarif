import { NextResponse } from "next/server";
import { askProviders } from "@/lib/server-ai";

const SYSTEM = `You are Dr. Arif Raza’s care assistant at NK Hospital, Kalaburagi. Have a warm, concise pre-consultation conversation for gastrointestinal, liver-pancreas, cancer and laparoscopic surgery concerns. Ask one useful question at a time based on what the patient just said. Do not use a fixed questionnaire. Do not diagnose, prescribe, predict cancer stage, or recommend treatment. If the patient reports emergency warning signs such as severe bleeding, vomiting blood, black tarry stool, confusion with jaundice, inability to keep fluids down, severe worsening pain, or a painful non-reducible swelling, clearly advise urgent medical care. Otherwise acknowledge the answer and ask the next relevant question. Return plain text only, no JSON and no markdown headings.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12).map((item: any) => ({ role: item.role === "assistant" ? "assistant" : "user", content: String(item.content || "").slice(0, 1000) })) : [];
  if (!messages.length) return NextResponse.json({ error: "A conversation is required." }, { status: 400 });
  const result = await askProviders([{ role: "system", content: SYSTEM }, ...messages]);
  if (!result) return NextResponse.json({ reply: "I’m having trouble connecting right now. Please describe your main concern, how long it has been present, and whether it is getting worse. The clinic team will review it.", source: "local" });
  return NextResponse.json({ reply: result.text, source: result.provider });
}
