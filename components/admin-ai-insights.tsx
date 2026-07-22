"use client";

import { ReactNode, useEffect, useState } from "react";

type Appointment = Record<string, any>;
const INSIGHT_STORAGE_KEY = "dr-arif:last-dashboard-insight";

function inlineInsight(text: string): ReactNode[] {
  const cleaned = text
    .replace(/^\s*[-•]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .replace(/^\s*[-–—]\s*/, "");
  return cleaned
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={index}>{part.replace(/\*+/g, "")}</span>
      ),
    );
}

function InsightBlocks({ text }: { text: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections: { title: string; lines: string[] }[] = [];

  for (const line of lines) {
    const title = line
      .replace(/^#{1,4}\s*/, "")
      .replace(/^\*+|\*+$/g, "")
      .trim();
    const isHeading =
      (/^[A-Z][A-Z\s-]{4,}$/.test(title) && !/[.:]/.test(title)) ||
      /^(CURRENT SNAPSHOT|OPERATIONAL TRENDS|PRACTICAL NEXT STEPS|LOCAL OPERATIONAL INSIGHTS)$/i.test(
        title,
      );
    if (isHeading) sections.push({ title, lines: [] });
    else if (sections.length) sections[sections.length - 1].lines.push(line);
    else sections.push({ title: "Operational overview", lines: [line] });
  }

  return (
    <div className="admin-ai-blocks">
      {sections.map((section, index) => {
        const bullets = section.lines.filter((line) =>
          /^[-•]\s|^\d+[.)]\s/.test(line),
        );
        const paragraphs = section.lines.filter(
          (line) => !/^[-•]\s|^\d+[.)]\s/.test(line),
        );
        return (
          <article
            className={`admin-ai-block ${index === 0 ? "admin-ai-block-lead" : ""}`}
            key={`${section.title}-${index}`}
          >
            <h3>{section.title}</h3>
            {paragraphs.map((line, lineIndex) => (
              <p key={`p-${lineIndex}`}>{inlineInsight(line)}</p>
            ))}
            {bullets.length > 0 && (
              <ul>
                {bullets.map((line, lineIndex) => (
                  <li key={`li-${lineIndex}`}>{inlineInsight(line)}</li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function AdminAiInsights({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const [insights, setInsights] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(INSIGHT_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { text?: string; source?: string };
      if (parsed.text) setInsights(parsed.text);
      if (parsed.source) setSource(parsed.source);
    } catch {
      // Ignore unavailable or stale browser storage.
    }
  }, []);

  async function generate() {
    setBusy(true);
    setError("");
    const statusCounts = appointments.reduce<Record<string, number>>(
      (out, item) => {
        const key = String(item.status || "new").toLowerCase();
        out[key] = (out[key] || 0) + 1;
        return out;
      },
      {},
    );
    const typeCounts = appointments.reduce<Record<string, number>>(
      (out, item) => {
        const key = String(item.consultation_type || "Unspecified");
        out[key] = (out[key] || 0) + 1;
        return out;
      },
      {},
    );
    const dates = appointments
      .map((item) => String(item.appointment_date || ""))
      .filter(Boolean)
      .sort();
    try {
      const response = await fetch("/api/admin-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: appointments.length,
          statusCounts,
          consultationTypes: typeCounts,
          appointmentDates: dates,
          preConsultationReports: appointments.filter(
            (item) => item.pre_diagnosis_report,
          ).length,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Insights unavailable");
      setInsights(String(data.text || "No operational insight was returned."));
      setSource(String(data.source || "local"));
      try {
        window.localStorage.setItem(
          INSIGHT_STORAGE_KEY,
          JSON.stringify({
            text: String(data.text || "No operational insight was returned."),
            source: String(data.source || "local"),
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        // Keep the report in the current session if storage is disabled.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Insights unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-ai-insights">
      <div className="admin-ai-head">
        <div>
          <span>CLINIC OPERATIONS AI</span>
          <h2>Dashboard insights</h2>
          <p>
            Understand demand, follow-up workload and intake coverage at a
            glance.
          </p>
        </div>
        <button
          className="button button-small"
          onClick={generate}
          disabled={busy}
        >
          {busy
            ? "Analysing…"
            : insights
              ? "Refresh insights"
              : "Analyse bookings"}
        </button>
      </div>
      {source && (
        <span className="admin-ai-source">
          <i />
          Secure clinic analysis
        </span>
      )}
      {error && <p className="form-error">{error}</p>}
      {insights && <InsightBlocks text={insights} />}
    </section>
  );
}
