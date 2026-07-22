import { NextResponse } from "next/server";
import { askProviders } from "@/lib/server-ai";

const SYSTEM = `You format a structured pre-consultation report for Dr. Arif Raza’s clinic. Do not conduct an interview. Do not add facts, diagnose, prescribe, recommend treatment, or change the patient's answers. Improve clarity and headings only. Preserve the heading PRE-CONSULTATION SUMMARY — NOT A DIAGNOSIS and state that a qualified clinician must assess the patient.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const localReport = String(body.localReport || "");
  if (!localReport) return NextResponse.json({ error: "A local assessment report is required." }, { status: 400 });
  try {
    const result = await askProviders([{ role: "system", content: SYSTEM }, { role: "user", content: localReport.slice(0, 12000) }]);
    if (result) return NextResponse.json({ text: result.text, source: "protected" });
  } catch { /* local report remains the source of truth */ }
  return NextResponse.json({ text: localReport, source: "protected" });
}
