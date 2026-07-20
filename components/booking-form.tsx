"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, LockKeyhole } from "./icons";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export function BookingForm({ compact=false }: { compact?: boolean }) {
  const [userId, setUserId] = useState<string|null>(null);
  const [status, setStatus] = useState<"idle"|"saving"|"done"|"error">("idle");
  useEffect(()=>{ getSupabase()?.auth.getUser().then(({data})=>setUserId(data.user?.id ?? null)); },[]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus("saving");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const booking = {
      user_id:userId, full_name:fd.get("full_name"), mobile_number:fd.get("mobile_number"),
      email:fd.get("email") || null, consultation_type:fd.get("consultation_type"),
      appointment_date:fd.get("appointment_date"), preferred_time:fd.get("preferred_time"),
      symptoms:fd.get("symptoms"), status:"new"
    };
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("appointments").insert(booking);
      if (error) { console.error(error); setStatus("error"); return; }
    } else {
      const current = JSON.parse(localStorage.getItem("demo-bookings") || "[]");
      localStorage.setItem("demo-bookings", JSON.stringify([{...booking,id:crypto.randomUUID(),created_at:new Date().toISOString()}, ...current]));
    }
    form.reset(); setStatus("done");
  }
  if(status==="done") return <div className="success-panel"><span><Check/></span><h3>Request received</h3><p>The clinic team will call you to confirm the date and time.</p><button className="text-button" onClick={()=>setStatus("idle")}>Book another appointment</button></div>;
  return <form className={`booking-form ${compact?"compact":""}`} onSubmit={submit}>
    {!compact && <div className="form-intro"><span className="eyebrow">APPOINTMENT REQUEST</span><h2>Tell us how we can help.</h2><p>Requests are reviewed during clinic hours. Your appointment is confirmed only after our team calls you.</p></div>}
    <div className="form-grid">
      <label>Full name<input name="full_name" placeholder="Patient's full name" required maxLength={100}/></label>
      <label>Mobile number<input name="mobile_number" placeholder="10-digit mobile number" pattern="[6-9][0-9]{9}" required/></label>
      <label>Email <small>optional</small><input type="email" name="email" placeholder="you@example.com"/></label>
      <label>Consultation type<select name="consultation_type" required defaultValue=""><option value="" disabled>Select visit type</option><option>New consultation</option><option>Follow-up</option><option>Second opinion</option><option>Report review</option></select></label>
      <label>Preferred date<input type="date" name="appointment_date" min={new Date().toISOString().slice(0,10)} required/></label>
      <label>Preferred time<select name="preferred_time" required defaultValue=""><option value="" disabled>Select a time window</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
      <label className="full">Symptoms or report details<textarea name="symptoms" rows={4} placeholder="Briefly describe the concern" required maxLength={1000}/></label>
    </div>
    {status==="error" && <p className="form-error">We couldn’t save your request. Please call the clinic directly.</p>}
    <button className="button form-submit" disabled={status==="saving"}><CalendarDays size={19}/>{status==="saving"?"Sending request…":"Request appointment"}</button>
    <p className="form-note"><LockKeyhole size={14}/>{isSupabaseConfigured?"Your request is stored securely.":"Demo mode: saved in this browser until Supabase is connected."} {!userId && <Link href="/login">Sign in</Link>}</p>
  </form>
}
