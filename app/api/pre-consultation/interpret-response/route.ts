import { NextResponse } from "next/server";
import { askProviders } from "@/lib/server-ai";

const SYSTEM = `Classify one patient free-text response for a gastrointestinal pre-consultation interview. Return JSON only. Do not diagnose, advise, prescribe, or answer the patient. Use only the supplied suggestion IDs and return understood=false when uncertain. Shape: {understood:boolean, matchedSuggestionId?:string, value?:string|string[]|number|boolean, clarificationQuestion?:string}.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const responseText = String(body.response || "").trim().slice(0, 800);
  const suggestions = Array.isArray(body.suggestions) ? body.suggestions.slice(0, 30).map((item: any) => ({ id: String(item.id), label: String(item.label), value: item.value })) : [];
  if (!responseText || !suggestions.length) return NextResponse.json({ understood: false, clarificationQuestion: "Please choose the closest option below or rephrase your response." });
  try {
    const result = await askProviders([{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify({ questionId: String(body.questionId || ""), module: String(body.module || ""), response: responseText, allowedSuggestions: suggestions }) }], true);
    if (!result) return NextResponse.json({ understood: false, clarificationQuestion: "Please choose the closest option below or rephrase your response." });
    const parsed = JSON.parse(result.text);
    if (!parsed || typeof parsed.understood !== "boolean") throw new Error("Invalid classifier response");
    if (parsed.matchedSuggestionId && !suggestions.some((item: any) => item.id === parsed.matchedSuggestionId)) parsed.understood = false;
    if (!parsed.understood) return NextResponse.json({ understood: false, clarificationQuestion: "I couldn’t map that to this question. Please choose the closest option below or rephrase it." });
    const matched = suggestions.find((item: any) => item.id === parsed.matchedSuggestionId);
    return NextResponse.json({ understood: true, matchedSuggestionId: matched?.id, value: parsed.value ?? matched?.value ?? responseText, provider: result.provider });
  } catch {
    return NextResponse.json({ understood: false, clarificationQuestion: "Please choose the closest option below or rephrase your response." });
  }
}
