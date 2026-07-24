import { ReactNode } from "react";

function inlineReport(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
}

export function AppointmentReport({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let skipNext = false;
  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`}>
        {bullets.map((item, index) => (
          <li key={`${item}-${index}`}>{inlineReport(item)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  lines.forEach((raw, index) => {
    if (skipNext) {
      skipNext = false;
      return;
    }
    const line = raw.trim();
    if (!line || /^[-_]{3,}$/.test(line)) {
      flushBullets();
      return;
    }
    if (/^[-*]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*]\s+/, ""));
      return;
    }
    flushBullets();
    const speaker = line.match(
      /^(Assistant|Patient|You|Dr\.?\s*Arif(?:’|')s assistant):\s*(.+)$/i,
    );
    if (speaker) {
      blocks.push(
        <div
          className={`report-speaker ${/patient|you/i.test(speaker[1]) ? "patient" : "assistant"}`}
          key={`speaker-${index}`}
        >
          <span>{speaker[1]}</span>
          <p>{inlineReport(speaker[2])}</p>
        </div>,
      );
      return;
    }
    if (/^(?:#{1,6}\s*)?\*{0,2}Next Steps:?\*{0,2}$/i.test(line)) {
      const nextLine = lines[index + 1]?.trim() || "";
      blocks.push(
        <div className="report-next-steps" key={`next-steps-${index}`}>
          <h3>Next steps</h3>
          {nextLine.startsWith(">") && (
            <p>{inlineReport(nextLine.replace(/^>\s?/, ""))}</p>
          )}
        </div>,
      );
      if (nextLine.startsWith(">")) skipNext = true;
    } else if (/^FULL CONVERSATION$/i.test(line))
      blocks.push(<h2 key={`heading-${index}`}>Full conversation</h2>);
    else if (/^#{1,3}\s+/.test(line)) {
      const level = Math.min(3, (line.match(/^#+/) || ["#"])[0].length);
      const Heading = level === 1 ? "h2" : "h3";
      blocks.push(
        <Heading key={`heading-${index}`}>
          {inlineReport(line.replace(/^#{1,3}\s+/, ""))}
        </Heading>,
      );
    } else if (/^\*\*[^*]+\*\*$/.test(line)) {
      blocks.push(<h2 key={`heading-${index}`}>{inlineReport(line)}</h2>);
    } else if (line.startsWith(">"))
      blocks.push(
        <blockquote key={`quote-${index}`}>
          {inlineReport(line.replace(/^>\s?/, ""))}
        </blockquote>,
      );
    else blocks.push(<p key={`paragraph-${index}`}>{inlineReport(line)}</p>);
  });
  flushBullets();
  return <div className="admin-readable-report">{blocks}</div>;
}
