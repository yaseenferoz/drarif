"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  CalendarDays,
  FileText,
  Phone,
  UserRound,
} from "@/components/icons";
import { DoctorLoader } from "@/components/doctor-loader";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { resolveUserRole } from "@/lib/use-user-role";
import { AppointmentReport } from "@/components/appointment-report";

type Appointment = Record<string, any>;

export default function AppointmentDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const client = getSupabase();
    if (!client || !isSupabaseConfigured) {
      setError("Secure database access is unavailable.");
      setLoading(false);
      return;
    }
    client.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      const role = await resolveUserRole(client, data.user.id);
      if (role.role !== "admin") {
        router.replace("/portal");
        return;
      }
      const result = await client
        .from("appointments")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();
      if (result.error) setError("We could not load this appointment.");
      else if (!result.data) setError("Appointment not found.");
      else setItem(result.data);
      setLoading(false);
    });
  }, [params.id, router]);

  if (loading) return <DoctorLoader />;
  return (
    <section className="admin-detail-shell">
      <div className="admin-detail-wrap">
        <Link className="admin-back-link" href="/admin">
          <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />{" "}
          Back to appointments
        </Link>
        {error ? (
          <div className="admin-detail-empty">
            <FileText />
            <h1>{error}</h1>
            <Link className="button" href="/admin">
              Return to admin
            </Link>
          </div>
        ) : (
          item && (
            <>
              <div className="admin-detail-head">
                <div>
                  <span className="eyebrow">APPOINTMENT RECORD</span>
                  <h1>{item.full_name}</h1>
                  <p>
                    {item.consultation_type || "Consultation"} ·{" "}
                    {item.appointment_date} · {item.preferred_time}
                  </p>
                </div>
                <span
                  className={`status ${String(item.status || "new").toLowerCase()}`}
                >
                  {item.status || "new"}
                </span>
              </div>
              <div className="admin-detail-grid">
                <section className="admin-detail-card">
                  <h2>
                    <UserRound size={18} /> Patient details
                  </h2>
                  <div className="admin-detail-fields">
                    <div>
                      <small>Full name</small>
                      <b>{item.full_name || "Not provided"}</b>
                    </div>
                    <div>
                      <small>Mobile number</small>
                      <b>
                        <a href={`tel:${item.mobile_number}`}>
                          {item.mobile_number || "Not provided"}
                        </a>
                      </b>
                    </div>
                    <div>
                      <small>Email</small>
                      <b>{item.email || "Not provided"}</b>
                    </div>
                    <div>
                      <small>Consultation</small>
                      <b>{item.consultation_type || "Not provided"}</b>
                    </div>
                    <div>
                      <small>Preferred date</small>
                      <b>{item.appointment_date || "Not provided"}</b>
                    </div>
                    <div>
                      <small>Preferred time</small>
                      <b>{item.preferred_time || "Not provided"}</b>
                    </div>
                  </div>
                </section>
                <section className="admin-detail-card">
                  <h2>
                    <CalendarDays size={18} /> Symptoms and request
                  </h2>
                  <p className="admin-detail-copy">
                    {item.symptoms ||
                      "No symptoms or report details were provided."}
                  </p>
                  {item.mobile_number && (
                    <a
                      className="button button-small"
                      href={`tel:${item.mobile_number}`}
                    >
                      <Phone size={16} /> Call patient
                    </a>
                  )}
                </section>
              </div>
              <section className="admin-detail-card admin-report-card">
                <h2>
                  <FileText size={18} /> Full pre-consultation report
                </h2>
                {item.pre_diagnosis_report ? (
                  <AppointmentReport text={String(item.pre_diagnosis_report)} />
                ) : (
                  <p className="admin-detail-copy">
                    No pre-consultation report was attached to this appointment.
                  </p>
                )}
              </section>
            </>
          )
        )}
      </div>
    </section>
  );
}
