import { NextResponse } from "next/server";

type EventType = "booking_created" | "status_changed";

function normalisePhone(value: unknown) {
  let phone = String(value ?? "")
    .trim()
    .replace(/[^\d+]/g, "");
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (phone.startsWith("00")) phone = phone.slice(2);
  // Clinic bookings are Indian numbers unless an international number is supplied.
  if (/^\d{10}$/.test(phone)) phone = `91${phone}`;
  return /^\d{8,15}$/.test(phone) ? phone : null;
}

function valuesFor(event: EventType, appointment: Record<string, unknown>) {
  const name = String(appointment.full_name || "Patient");
  const date = String(appointment.appointment_date || "");
  const time = String(appointment.preferred_time || "");
  const type = String(appointment.consultation_type || "consultation");
  const status = String(appointment.status || "new");
  return event === "booking_created"
    ? [name, `${date}${time ? ` · ${time}` : ""}`, type]
    : [name, status, `${date}${time ? ` · ${time}` : ""}`];
}

export async function POST(request: Request) {
  const enabled = process.env.WHATSAPP_ENABLED !== "false";
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!enabled || !token || !phoneNumberId) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  let body: {
    to?: unknown;
    event?: EventType;
    appointment?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 },
    );
  }
  const to = normalisePhone(body.to);
  if (
    !to ||
    !body.appointment ||
    !["booking_created", "status_changed"].includes(String(body.event))
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid notification payload" },
      { status: 400 },
    );
  }
  const event = body.event as EventType;
  const mode = process.env.WHATSAPP_MESSAGE_MODE || "template";
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || "v25.0";
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
  };
  if (mode === "text") {
    const a = body.appointment;
    const title =
      event === "booking_created"
        ? "Appointment request received"
        : "Appointment status updated";
    payload.type = "text";
    payload.text = {
      preview_url: false,
      body: `${title}, ${String(a.full_name || "patient")}. ${event === "booking_created" ? "The clinic team will contact you to confirm." : `Current status: ${String(a.status || "new")}.`}`,
    };
  } else {
    const name =
      event === "booking_created"
        ? process.env.WHATSAPP_BOOKING_TEMPLATE_NAME ||
          process.env.WHATSAPP_TEMPLATE_NAME ||
          "hello_world"
        : process.env.WHATSAPP_STATUS_TEMPLATE_NAME ||
          process.env.WHATSAPP_TEMPLATE_NAME ||
          "hello_world";
    const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";
    const count = Math.max(
      0,
      Number(process.env.WHATSAPP_TEMPLATE_PARAM_COUNT || 0),
    );
    payload.type = "template";
    const template: Record<string, unknown> = {
      name,
      language: { code: language },
    };
    if (count > 0)
      template.components = [
        {
          type: "body",
          parameters: valuesFor(event, body.appointment)
            .slice(0, count)
            .map((text) => ({ type: "text", text })),
        },
      ];
    payload.template = template;
  }
  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      return NextResponse.json(
        {
          ok: false,
          error: data?.error?.message || "WhatsApp rejected the message",
        },
        { status: 502 },
      );
    return NextResponse.json({
      ok: true,
      recipient: to,
      mode,
      messageId: data?.messages?.[0]?.id || null,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "WhatsApp service unavailable" },
      { status: 502 },
    );
  }
}
