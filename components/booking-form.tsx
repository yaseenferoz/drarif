"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, LockKeyhole } from "./icons";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { PreConsultationAssistant } from "@/components/pre-consultation-assistant";

export function BookingForm({ compact=false, showPrecheck=false }: { compact?: boolean; showPrecheck?: boolean }) {
  const [userId, setUserId] = useState<string|null>(null);
  const [status, setStatus] = useState<"idle"|"saving"|"done"|"error">("idle");
  const [errorMessage,setErrorMessage] = useState("");
  const [preDiagnosisReport,setPreDiagnosisReport] = useState("");
  const [precheckEnabled,setPrecheckEnabled] = useState(false);
  const [precheckReady,setPrecheckReady] = useState(false);
  const [activeAppointment,setActiveAppointment] = useState<{appointment_date:string;status:string}|null>(null);
  useEffect(()=>{ getSupabase()?.auth.getUser().then(({data})=>setUserId(data.user?.id ?? null)); },[]);
  useEffect(()=>{const client=getSupabase();if(!client)return;client.auth.getUser().then(async({data})=>{if(!data.user)return;const {data:rows}=await client.from("appointments").select("appointment_date,status").eq("user_id",data.user.id).in("status",["new","confirmed"]).order("created_at",{ascending:false}).limit(1);if(rows?.[0])setActiveAppointment(rows[0])})},[]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus("saving"); setErrorMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const booking = {
      user_id:userId, full_name:fd.get("full_name"), mobile_number:fd.get("mobile_number"),
      email:fd.get("email") || null, consultation_type:fd.get("consultation_type"),
      appointment_date:fd.get("appointment_date"), preferred_time:fd.get("preferred_time"),
      // Status belongs to the clinic workflow. Keeping it out of the request
      // also supports the original appointments table during its CMS upgrade.
      symptoms:fd.get("symptoms")
      ,pre_diagnosis_report:preDiagnosisReport||null
    };
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("appointments").insert(booking);
      if (error) { setErrorMessage(error.code === "23505" || /active appointment|already exists|duplicate/i.test(error.message) ? "An active appointment already exists for this name and mobile number. Please wait until it is completed or cancelled before booking again." : "We couldn’t save your request. Please try again or call the clinic directly."); setStatus("error"); return; }
    } else {
      const current = JSON.parse(localStorage.getItem("demo-bookings") || "[]");
      localStorage.setItem("demo-bookings", JSON.stringify([{...booking,id:crypto.randomUUID(),created_at:new Date().toISOString()}, ...current]));
    }
    localStorage.removeItem("preconsultation-report");setPreDiagnosisReport("");form.reset(); setPrecheckEnabled(false); setPrecheckReady(false); setStatus("done");
  }
  if(activeAppointment&&(!compact||showPrecheck))return <div className="booking-in-progress"><span className="eyebrow">APPOINTMENT IN PROGRESS</span><h2>Your request is already with the clinic.</h2><p>You have an active appointment request for <strong>{activeAppointment.appointment_date}</strong>. Please wait for the clinic team to confirm or complete it before creating another request.</p><Link className="button" href="/portal">View appointment status</Link></div>;
  if(status==="done") return <div className="success-panel"><span><Check/></span><h3>Request received</h3><p>The clinic team will call you to confirm the date and time.</p><button className="text-button" onClick={()=>setStatus("idle")}>Book another appointment</button></div>;
  return <form className={`booking-form ${compact?"compact":""}`} onSubmit={submit} onInput={event=>setPrecheckReady(event.currentTarget.checkValidity())}>
    {!compact && <div className="form-intro"><span className="eyebrow">APPOINTMENT REQUEST</span><h2>Tell us how we can help.</h2><p>Requests are reviewed during clinic hours. Your appointment is confirmed only after our team calls you.</p></div>}
    <div className="form-grid">
      <label>Full name<input name="full_name" placeholder="Patient's full name" required maxLength={100}/></label>
      <label>Mobile number<input name="mobile_number" placeholder="10-digit mobile number" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} minLength={10} required onInput={event=>{const value=event.currentTarget.value.replace(/\D/g,"").slice(0,10);event.currentTarget.value=value&&!/^[6-9]/.test(value)?"":value}}/></label>
      <label>Email <small>optional</small><input type="email" name="email" placeholder="you@example.com" maxLength={254}/></label>
      <label>Consultation type<select name="consultation_type" required defaultValue=""><option value="" disabled>Select visit type</option><option>New consultation</option><option>Follow-up</option><option>Second opinion</option><option>Report review</option></select></label>
      <label>Preferred date<input type="date" name="appointment_date" min={new Date().toISOString().slice(0,10)} required/></label>
      <label>Preferred time<select name="preferred_time" required defaultValue=""><option value="" disabled>Select a time window</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
      <label className="full">Symptoms or report details<textarea name="symptoms" rows={4} placeholder="Briefly describe the concern" required maxLength={1000}/></label>
    </div>
    {showPrecheck&&<label className="full precheck-toggle">Pre-check summary <small>optional</small><select disabled={!precheckReady} value={precheckEnabled?"enabled":"disabled"} onChange={event=>{const enabled=event.target.value==="enabled";setPrecheckEnabled(enabled);if(!enabled){setPreDiagnosisReport("");localStorage.removeItem("preconsultation-report")}}}><option value="disabled">{precheckReady?"Disabled":"Complete the required details above first"}</option><option value="enabled">Enabled — ask questions before sending</option></select>{!precheckReady&&<small className="precheck-hint">Enter a valid name, mobile number, consultation type, date, time and concern to start the assistant.</small>}</label>}
    {showPrecheck&&precheckEnabled&&<PreConsultationAssistant onComplete={setPreDiagnosisReport}/>} 
    {status==="error" && <p className="form-error">{errorMessage}</p>}
    <button className="button form-submit" disabled={status==="saving"}><CalendarDays size={19}/>{status==="saving"?"Sending request…":"Request appointment"}</button>
    <p className="form-note"><LockKeyhole size={14}/>{isSupabaseConfigured?"Your request is stored securely.":"Demo mode: saved in this browser until Supabase is connected."} {!userId && <Link href="/login">Sign in</Link>}</p>
  </form>
}
