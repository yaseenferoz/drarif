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
    if (/^FULL CONVERSATION$/i.test(line))
      blocks.push(<h2 key={`heading-${index}`}>Full conversation</h2>);
    else if (/^#{1,3}\s+/.test(line)) {
      const level = Math.min(3, (line.match(/^#+/) || ["#"])[0].length);
      const Heading = level === 1 ? "h2" : "h3";
      blocks.push(
        <Heading key={`heading-${index}`}>
          {inlineReport(line.replace(/^#{1,3}\s+/, ""))}
        </Heading>,
      );
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
