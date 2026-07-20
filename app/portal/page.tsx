"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, ShieldCheck } from "@/components/icons";
import { getSupabase } from "@/lib/supabase";
type Booking={id:string;appointment_date:string;preferred_time:string;consultation_type:string;status:string};
export default function Portal(){
  const [email,setEmail]=useState("");const [role,setRole]=useState("patient");const [items,setItems]=useState<Booking[]>([]);const [loading,setLoading]=useState(true);const router=useRouter();
  useEffect(()=>{const s=getSupabase();if(!s){setLoading(false);return}s.auth.getUser().then(async({data})=>{if(!data.user){router.replace("/login");return}setEmail(data.user.email||"");const [{data:profile},{data:rows}]=await Promise.all([s.from("profiles").select("role").eq("id",data.user.id).maybeSingle(),s.from("appointments").select("*").eq("user_id",data.user.id).order("created_at",{ascending:false})]);setRole(profile?.role||"patient");setItems(rows||[]);setLoading(false)})},[router]);
  async function logout(){await getSupabase()?.auth.signOut();router.push("/login")}
  return <section className="portal-shell"><div className="shell"><div className="portal-head"><div><span className="eyebrow">PATIENT PORTAL</span><h1>Your care requests</h1></div><div className="portal-actions">{role==="admin"&&<Link className="button button-dark" href="/admin"><ShieldCheck size={18}/> Open admin dashboard</Link>}<Link className="button" href="/booking"><CalendarDays size={18}/> New appointment</Link></div></div><div className="portal-grid"><aside className="portal-nav"><div className="portal-user"><b>{role==="admin"?"Administrator":"Patient account"}</b><small>{email||"Demo preview"}</small></div>{role==="admin"&&<Link href="/admin"><ShieldCheck size={17}/>Admin dashboard</Link>}<Link href="/portal"><LayoutDashboard size={17}/>Appointments</Link><button onClick={logout}><LogOut size={17}/>Sign out</button></aside><div className="portal-content"><h2>Appointments</h2>{loading?<p>Loading…</p>:items.length?items.map(x=><div className="booking-row" key={x.id}><b>{x.consultation_type}</b><span>{x.appointment_date}</span><span>{x.preferred_time}</span><span className="status">{x.status}</span></div>):<div className="success-panel"><span><CalendarDays/></span><h3>No appointments yet</h3><p>Your appointment requests and confirmation status will appear here.</p><Link className="button" href="/booking">Request appointment</Link></div>}</div></div></div></section>
}
