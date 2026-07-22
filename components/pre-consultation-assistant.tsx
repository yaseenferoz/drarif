"use client";
import { KeyboardEvent, useRef, useState } from "react";

type Message = { role: "assistant" | "user"; content: string };
// Keep the intake focused: the assistant gathers the core concern, duration,
// severity/associated symptoms, history and red flags, then closes the session.
const MAX_PATIENT_RESPONSES = 7;
export function PreConsultationAssistant({
  onComplete,
}: {
  onComplete: (report: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [notice, setNotice] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const scroll = () =>
    setTimeout(() => {
      if (chatRef.current)
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 0);
  const start = () => {
    setOpen(true);
    if (!messages.length) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello, I’m Dr. Arif Raza’s care assistant at NK Hospital, Kalaburagi. What health problem would you like Dr. Arif’s team to understand before your consultation?",
        },
      ]);
      scroll();
    }
  };
  async function send() {
    const text = input.trim();
    if (!text || busy || done) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setNotice("");
    setBusy(true);
    scroll();
    try {
      const response = await fetch("/api/pre-consultation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await response.json();
      const withAssistant: Message[] = [
        ...next,
        {
          role: "assistant",
          content: String(
            data.reply || "Please tell me a little more about that.",
          ),
        },
      ];
      setMessages(withAssistant);
      scroll();
      if (
        withAssistant.filter((item) => item.role === "user").length >=
        MAX_PATIENT_RESPONSES
      ) {
        await finish(withAssistant, true);
      }
    } catch {
      // Do not leave a completed intake stranded when the model times out.
      // Eight patient answers are enough for the clinician-review report.
      if (
        next.filter((item) => item.role === "user").length >=
        MAX_PATIENT_RESPONSES
      ) {
        await finish(next, true);
      } else {
        setNotice(
          "The assistant is temporarily unavailable. Please try again or call the clinic.",
        );
      }
    } finally {
      setBusy(false);
    }
  }
  async function finish(conversation = messages, force = false) {
    if (
      conversation.filter((item) => item.role === "user").length < 1 ||
      (busy && !force)
    )
      return;
    setBusy(true);
    const transcript = conversation
      .map(
        (item) =>
          `${item.role === "assistant" ? "Assistant" : "Patient"}: ${item.content}`,
      )
      .join("\n\n");
    try {
      const response = await fetch("/api/preconsultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localReport: `PRE-CONSULTATION CONVERSATION — NOT A DIAGNOSIS\n\n${transcript}`,
        }),
      });
      const data = await response.json();
      const summary = String(data.text || "").trim();
      // Keep both the concise clinician summary and the original conversation.
      // The appointment list shows only a two-line preview; the detail route
      // exposes this complete record for the clinic team.
      const report = `${summary || "PRE-CONSULTATION CONVERSATION — NOT A DIAGNOSIS"}\n\nFULL CONVERSATION\n\n${transcript}`;
      onComplete(report);
      setDone(true);
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          content:
            "Thank you. I’ve prepared a clinician-review summary for Dr. Arif’s team.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }
  const reset = () => {
    setMessages([]);
    setInput("");
    setDone(false);
    setNotice("");
    onComplete("");
  };
  return (
    <div className="preconsult-card">
      <div className="preconsult-head">
        <div>
          <span className="eyebrow">DR. ARIF RAZA’S CARE ASSISTANT</span>
          <h3>Prepare for your appointment.</h3>
        </div>
        <button
          type="button"
          className="button button-small button-ghost"
          onClick={() => {
            if (!open) start();
            else setOpen(false);
          }}
        >
          {open ? "Close" : "Start assessment"}
        </button>
      </div>
      <p className="preconsult-warning">
        <strong>Important:</strong> This is a conversation for Dr. Arif’s team,
        not a diagnosis, treatment plan, or emergency service.
      </p>
      {open && (
        <>
          <div ref={chatRef} className="preconsult-chat ai-booking-chat">
            {messages.map((message, index) => (
              <div
                className={`ai-chat-message ${message.role}`}
                key={`${message.role}-${index}`}
              >
                <span>
                  {message.role === "assistant"
                    ? "Dr. Arif’s assistant"
                    : "You"}
                </span>
                <p>{message.content}</p>
              </div>
            ))}
            {busy && (
              <div className="ai-chat-message assistant">
                <span>Dr. Arif’s assistant</span>
                <p>Reviewing your message…</p>
              </div>
            )}
          </div>
          {!done && (
            <div className="ai-chat-form">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder="Reply to Dr. Arif’s assistant…"
                rows={2}
                disabled={busy}
              />
              <button
                type="button"
                className="button button-small"
                onClick={() => void send()}
                disabled={busy || !input.trim()}
              >
                Send
              </button>
            </div>
          )}
          {messages.some((item) => item.role === "user") &&
            !done &&
            messages.filter((item) => item.role === "user").length <
              MAX_PATIENT_RESPONSES && (
              <button
                type="button"
                className="button button-small preconsult-finish"
                onClick={() => void finish()}
                disabled={busy}
              >
                Finish and attach summary
              </button>
            )}
          {!done &&
            messages.filter((item) => item.role === "user").length >=
              MAX_PATIENT_RESPONSES &&
            !busy && (
              <p className="preconsult-limit">
                We have enough information. Your concise summary is being
                prepared for the clinic team.
              </p>
            )}
          {notice && <p className="form-error">{notice}</p>}
          {done && (
            <div className="preconsult-done">
              <strong>Assessment attached to your appointment</strong>
              <p>
                Dr. Arif’s team will review the conversation before
                consultation.
              </p>
              <button type="button" className="text-button" onClick={reset}>
                Start a new assessment
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
