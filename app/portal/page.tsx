"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
  Save,
} from "@/components/icons";
import { getSupabase } from "@/lib/supabase";
import { resolveUserRole } from "@/lib/use-user-role";

type Booking = {
  id: string;
  appointment_date: string;
  preferred_time: string;
  consultation_type: string;
  status: string;
  symptoms?: string | null;
};
type Profile = {
  id: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  address: string;
  city: string;
  emergency_contact: string;
  allergies: string;
  medical_history: string;
};
const blank: Profile = {
  id: "",
  full_name: "",
  date_of_birth: "",
  phone: "",
  address: "",
  city: "",
  emergency_contact: "",
  allergies: "",
  medical_history: "",
};

export default function Portal() {
  const [email, setEmail] = useState(""),
    [role, setRole] = useState("patient"),
    [items, setItems] = useState<Booking[]>([]),
    [profile, setProfile] = useState<Profile>(blank),
    [profileOpen, setProfileOpen] = useState(false),
    [editing, setEditing] = useState(false),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const s = getSupabase();
    if (!s) {
      setLoading(false);
      return;
    }
    s.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setEmail(data.user.email || "");
      const [roleResult, bookings, profileResult] = await Promise.all([
        resolveUserRole(s, data.user.id),
        s
          .from("appointments")
          .select("*")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false }),
        s.from("profiles").select("*").eq("id", data.user.id).maybeSingle(),
      ]);
      if (roleResult.role === "admin") {
        router.replace("/admin");
        return;
      }
      setRole(roleResult.role);
      setItems(bookings.data || []);
      setProfile({
        ...blank,
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || "",
        ...(profileResult.data || {}),
      });
      setLoading(false);
    });
  }, [router]);
  async function logout() {
    await getSupabase()?.auth.signOut();
    router.push("/login");
  }
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const s = getSupabase();
    if (!s) return;
    setSaving(true);
    setMessage("");
    const fd = new FormData(event.currentTarget);
    const values = {
      full_name: String(fd.get("full_name") || "").trim(),
      date_of_birth: String(fd.get("date_of_birth") || "") || null,
      phone: String(fd.get("phone") || "").trim(),
      address: String(fd.get("address") || "").trim(),
      city: String(fd.get("city") || "").trim(),
      emergency_contact: String(fd.get("emergency_contact") || "").trim(),
      allergies: String(fd.get("allergies") || "").trim(),
      medical_history: String(fd.get("medical_history") || "").trim(),
    };
    const { data, error } = await s
      .from("profiles")
      .update(values)
      .eq("id", profile.id)
      .select()
      .single();
    if (error) setMessage(`Could not save profile: ${error.message}`);
    else {
      setProfile({ ...profile, ...data });
      setEditing(false);
      setMessage("Profile details saved.");
    }
    setSaving(false);
  }
  const hasActive = items.some((item) =>
    ["new", "confirmed"].includes(String(item.status || "new").toLowerCase()),
  );
  return (
    <section className="portal-shell">
      <div className="shell">
        <div className="portal-head">
          <div>
            <span className="eyebrow">PATIENT PORTAL</span>
            <h1>Your care requests</h1>
          </div>
          <div className="portal-actions">
            {hasActive ? (
              <span className="button button-ghost portal-booking-locked">
                Appointment in progress
              </span>
            ) : (
              <Link className="button" href="/booking">
                <CalendarDays size={18} /> New appointment
              </Link>
            )}
          </div>
        </div>
        <div className="portal-grid">
          <aside className="portal-nav">
            <div className="portal-user">
              <b>{role === "admin" ? "Administrator" : "Patient account"}</b>
              <small>{email || "Demo preview"}</small>
            </div>
            <button
              className={!profileOpen ? "portal-nav-active" : ""}
              onClick={() => {
                setProfileOpen(false);
                setEditing(false);
              }}
            >
              <LayoutDashboard size={17} />
              Appointments
            </button>
            <button
              className={
                profileOpen
                  ? "portal-profile-link portal-nav-active"
                  : "portal-profile-link"
              }
              onClick={() => {
                setProfileOpen(true);
                setEditing(false);
              }}
            >
              <UserRound size={17} />
              Profile details
            </button>
            {role === "admin" && (
              <Link href="/admin">
                <ShieldCheck size={17} />
                Admin dashboard
              </Link>
            )}
            <button onClick={logout}>
              <LogOut size={17} />
              Sign out
            </button>
          </aside>
          <div className="portal-content">
            {message && <p className="portal-save-message">{message}</p>}
            {profileOpen ? (
              <section className="profile-card">
                <div className="profile-card-head">
                  <div>
                    <span className="eyebrow">YOUR DETAILS</span>
                    <h2>Patient profile</h2>
                    <p>
                      Keep these details current so the clinic team can prepare
                      for your visit.
                    </p>
                  </div>
                  {!editing && (
                    <button
                      type="button"
                      className="button button-small button-ghost"
                      onClick={() => setEditing(true)}
                    >
                      <UserRound size={16} /> Edit profile
                    </button>
                  )}
                </div>
                {editing ? (
                  <form className="profile-form" onSubmit={saveProfile}>
                    <label>
                      Full name
                      <input
                        name="full_name"
                        defaultValue={profile.full_name}
                        required
                      />
                    </label>
                    <label>
                      Email address
                      <input value={email} readOnly />
                    </label>
                    <label>
                      Date of birth
                      <input
                        type="date"
                        name="date_of_birth"
                        defaultValue={profile.date_of_birth || ""}
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        name="phone"
                        inputMode="numeric"
                        pattern="[6-9][0-9]{9}"
                        defaultValue={profile.phone || ""}
                        placeholder="10-digit mobile number"
                      />
                    </label>
                    <label className="profile-wide">
                      Address
                      <textarea
                        name="address"
                        rows={2}
                        defaultValue={profile.address || ""}
                      />
                    </label>
                    <label>
                      City
                      <input name="city" defaultValue={profile.city || ""} />
                    </label>
                    <label>
                      Emergency contact
                      <input
                        name="emergency_contact"
                        defaultValue={profile.emergency_contact || ""}
                      />
                    </label>
                    <label className="profile-wide">
                      Allergies
                      <input
                        name="allergies"
                        defaultValue={profile.allergies || ""}
                        placeholder="Medicines or foods, if any"
                      />
                    </label>
                    <label className="profile-wide">
                      Relevant medical history
                      <textarea
                        name="medical_history"
                        rows={2}
                        defaultValue={profile.medical_history || ""}
                      />
                    </label>
                    <div className="profile-actions">
                      <button
                        type="button"
                        className="button button-ghost"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </button>
                      <button className="button" disabled={saving}>
                        <Save size={16} />
                        {saving ? "Saving…" : "Save profile"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-details">
                    <div>
                      <small>Full name</small>
                      <b>{profile.full_name || "Not added"}</b>
                    </div>
                    <div>
                      <small>Email</small>
                      <b>{email || "Not added"}</b>
                    </div>
                    <div>
                      <small>Date of birth</small>
                      <b>{profile.date_of_birth || "Not added"}</b>
                    </div>
                    <div>
                      <small>Phone</small>
                      <b>{profile.phone || "Not added"}</b>
                    </div>
                    <div>
                      <small>Address</small>
                      <b>
                        {[profile.address, profile.city]
                          .filter(Boolean)
                          .join(", ") || "Not added"}
                      </b>
                    </div>
                    <div>
                      <small>Emergency contact</small>
                      <b>{profile.emergency_contact || "Not added"}</b>
                    </div>
                    <div>
                      <small>Allergies</small>
                      <b>{profile.allergies || "None added"}</b>
                    </div>
                    <div className="profile-detail-wide">
                      <small>Relevant medical history</small>
                      <b>{profile.medical_history || "None added"}</b>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="portal-appointments">
                <h2>Appointments</h2>
                {loading ? (
                  <p>Loading…</p>
                ) : items.length ? (
                  items.map((x) => (
                    <div className="booking-row" key={x.id}>
                      <div className="booking-row-main">
                        <b>{x.consultation_type}</b>
                        <small>
                          {x.appointment_date} · {x.preferred_time}
                        </small>
                        {x.symptoms && (
                          <p className="booking-row-symptoms">{x.symptoms}</p>
                        )}
                      </div>
                      <span className="status">{x.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="success-panel">
                    <span>
                      <CalendarDays />
                    </span>
                    <h3>No appointments yet</h3>
                    <p>
                      Your appointment requests and confirmation status will
                      appear here.
                    </p>
                    <Link className="button" href="/booking">
                      Request appointment
                    </Link>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
