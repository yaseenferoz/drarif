"use client";
import { FormEvent,useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText, LayoutDashboard, LogOut, Plus, Stethoscope, Upload, Users } from "@/components/icons";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Treatment,Article } from "@/lib/site-data";

type Tab="overview"|"appointments"|"treatments"|"articles"|"media";
export default function Admin(){
  const [allowed,setAllowed]=useState(false),[loading,setLoading]=useState(true),[tab,setTab]=useState<Tab>("overview");
  const [appointments,setAppointments]=useState<any[]>([]),[treatments,setTreatments]=useState<Treatment[]>([]),[articles,setArticles]=useState<Article[]>([]);const router=useRouter();
  async function load(){
    const s=getSupabase();if(!s){setLoading(false);return}
    const {data:{user}}=await s.auth.getUser();if(!user){router.replace("/login");return}
    const {data:profile}=await s.from("profiles").select("role").eq("id",user.id).single();
    if(profile?.role!=="admin"){setLoading(false);return}setAllowed(true);
    const [ap,tr,ar]=await Promise.all([s.from("appointments").select("*").order("created_at",{ascending:false}),s.from("treatments").select("*").order("sort_order"),s.from("articles").select("*").order("published_at",{ascending:false})]);
    setAppointments(ap.data||[]);setTreatments(tr.data||[]);setArticles(ar.data||[]);setLoading(false);
  }
  useEffect(()=>{load()},[]);
  if(loading)return <section className="auth-shell"><p>Checking admin access…</p></section>;
  if(!isSupabaseConfigured)return <Denied title="Supabase setup required" text="Add the environment variables, run the included schema, and assign your account the admin role."/>;
  if(!allowed)return <Denied title="Admin access only" text="This account does not have the admin role."/>;
  return <section className="portal-shell"><div className="shell"><div className="portal-head"><div><span className="eyebrow">ADMIN PORTAL</span><h1>Clinic workspace</h1></div><button className="button button-ghost" onClick={async()=>{await getSupabase()?.auth.signOut();router.push("/login")}}><LogOut size={17}/> Sign out</button></div><div className="portal-grid"><aside className="portal-nav admin-nav"><AdminLink name="Overview" icon={<LayoutDashboard/>} onClick={()=>setTab("overview")}/><AdminLink name="Appointments" icon={<CalendarDays/>} onClick={()=>setTab("appointments")}/><AdminLink name="Treatments" icon={<Stethoscope/>} onClick={()=>setTab("treatments")}/><AdminLink name="Articles" icon={<FileText/>} onClick={()=>setTab("articles")}/><AdminLink name="Media" icon={<Upload/>} onClick={()=>setTab("media")}/></aside><div className="portal-content">{tab==="overview"&&<Overview a={appointments} t={treatments} r={articles}/>}
  {tab==="appointments"&&<Appointments items={appointments} reload={load}/>}
  {tab==="treatments"&&<ContentManager type="treatments" items={treatments} reload={load}/>}
  {tab==="articles"&&<ContentManager type="articles" items={articles} reload={load}/>}
  {tab==="media"&&<Media/>}</div></div></div></section>
}
function Denied({title,text}:{title:string;text:string}){return <section className="auth-shell"><div className="auth-card"><h1>{title}</h1><p>{text}</p><a className="button" href="/login">Return to sign in</a></div></section>}
function AdminLink({name,icon,onClick}:{name:string;icon:React.ReactNode;onClick:()=>void}){return <button onClick={onClick}>{icon}{name}</button>}
function Overview({a,t,r}:{a:any[];t:any[];r:any[]}){return <><h2>Today at a glance</h2><div className="credentials"><div><b>{a.filter(x=>x.status==="new").length}</b><span>New appointment requests</span></div><div><b>{a.length}</b><span>Total appointments</span></div><div><b>{t.length}</b><span>Treatment pages</span></div><div><b>{r.length}</b><span>Health articles</span></div></div></>}
function Appointments({items,reload}:{items:any[];reload:()=>void}){async function change(id:string,status:string){await getSupabase()?.from("appointments").update({status}).eq("id",id);reload()}return <><h2>Appointment requests</h2>{items.map(x=><div className="booking-row" key={x.id}><div><b>{x.full_name}</b><br/><small>{x.mobile_number}</small></div><span>{x.appointment_date}<br/>{x.preferred_time}</span><span>{x.consultation_type}</span><select value={x.status} onChange={e=>change(x.id,e.target.value)}><option>new</option><option>confirmed</option><option>completed</option><option>cancelled</option></select></div>)}</>}
function ContentManager({type,items,reload}:{type:"treatments"|"articles";items:any[];reload:()=>void}){
  const [editing,setEditing]=useState<any|null>(null);
  async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();const fd=new FormData(e.currentTarget);const base={title:String(fd.get("title")),slug:String(fd.get("slug")),excerpt:String(fd.get("excerpt")),image_url:String(fd.get("image_url")),published:true};const payload:any=type==="treatments"?{...base,eyebrow:String(fd.get("eyebrow")),symptoms:[],evaluations:[],treatments:[],preparation:[],urgent_signs:[],recovery:""}:{...base,category:String(fd.get("category")),reading_minutes:5,content:String(fd.get("content"))};const s=getSupabase();const table:any=s?.from(type);if(editing?.id)await table?.update(payload).eq("id",editing.id);else await table?.insert(payload);setEditing(null);reload()}
  return <><div className="portal-head"><h2>{type==="treatments"?"Treatment pages":"Health articles"}</h2><button className="button button-small" onClick={()=>setEditing({})}><Plus size={16}/> Add new</button></div>{editing&&<form className="admin-form" onSubmit={save}><input name="title" defaultValue={editing.title} placeholder="Title" required/><input name="slug" defaultValue={editing.slug} placeholder="url-slug" required/><input name={type==="treatments"?"eyebrow":"category"} defaultValue={editing.eyebrow||editing.category} placeholder={type==="treatments"?"Category label":"Category"} required/><input name="image_url" defaultValue={editing.image_url} placeholder="Image URL" required/><textarea name="excerpt" defaultValue={editing.excerpt} placeholder="Short summary" required/>{type==="articles"&&<textarea name="content" defaultValue={editing.content} rows={8} placeholder="Article content" required/>}<button className="button">Save content</button><button type="button" className="text-button" onClick={()=>setEditing(null)}>Cancel</button></form>}<div>{items.map(x=><div className="booking-row" key={x.id}><b>{x.title}</b><span>/{x.slug}</span><span className="status">{x.published?"Published":"Draft"}</span><button className="text-button" onClick={()=>setEditing(x)}>Edit</button></div>)}</div></>
}
function Media(){const [message,setMessage]=useState("");async function upload(e:FormEvent<HTMLFormElement>){e.preventDefault();const file=(new FormData(e.currentTarget).get("file") as File);if(!file)return;const path=`${Date.now()}-${file.name.replace(/\s/g,"-")}`;const {data,error}=await getSupabase()!.storage.from("site-media").upload(path,file);setMessage(error?.message||(data?`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-media/${data.path}`:"Upload failed"))}return <><h2>Media library</h2><p>Upload images for treatment pages, articles and site sections.</p><form className="admin-form" onSubmit={upload}><input type="file" name="file" accept="image/*" required/><button className="button"><Upload size={17}/> Upload image</button></form>{message&&<p className="form-note">{message}</p>}</>}
