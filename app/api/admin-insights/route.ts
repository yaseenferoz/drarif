import { NextResponse } from "next/server";
import { askProviders } from "@/lib/server-ai";

const SYSTEM = `You are a clinic operations analyst for Dr. Arif Raza's clinic. Analyse only the aggregate appointment metadata supplied by the admin. Do not diagnose patients, predict disease, infer a patient's medical condition, or expose personal information. Return concise plain-text sections: CURRENT SNAPSHOT, OPERATIONAL TRENDS, and PRACTICAL NEXT STEPS. Clearly state that this is operational analysis for staff and not clinical advice. Never invent facts that are not in the data.`;

function localInsights(data: any) {
  const statuses = data.statusCounts || {};
  const types = data.consultationTypes || {};
  const topType = Object.entries(types).sort((a: any, b: any) => b[1] - a[1])[0];
  const active = Number(statuses.new || 0) + Number(statuses.confirmed || 0);
  const dates = Array.isArray(data.appointmentDates) ? data.appointmentDates : [];
  return `LOCAL OPERATIONAL INSIGHTS (provider limit reached)\n\nCURRENT SNAPSHOT\n• ${data.total || 0} total appointment requests\n• ${active} active requests (${statuses.new || 0} new, ${statuses.confirmed || 0} confirmed)\n• ${statuses.completed || 0} completed and ${statuses.cancelled || 0} cancelled\n• ${data.preConsultationReports || 0} appointments include a pre-consultation report\n\nOPERATIONAL TRENDS\n• Most requested visit type: ${topType ? `${topType[0]} (${topType[1]})` : "No consultation type data yet"}\n• Appointment dates currently span ${dates.length ? `${dates[0]} to ${dates[dates.length - 1]}` : "no recorded dates"}\n\nPRACTICAL NEXT STEPS\n• Review new requests first and update their status after calling the patient.\n• Use the pre-consultation reports as clinician-review context only.\n• This is operational analysis, not a diagnosis or clinical prediction.`;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const result = await askProviders([{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify(data).slice(0, 12000) }]);
    if (!result) return NextResponse.json({ text: localInsights(data), source: "protected" });
    return NextResponse.json({ text: result.text, source: "protected" });
  } catch { return NextResponse.json({ text: localInsights({}), source: "protected" }); }
}
