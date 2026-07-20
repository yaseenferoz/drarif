"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays, FileText, Images, LayoutDashboard, LogOut, Menu, Pencil, Plus,
  Settings, Stethoscope, Trash2, Upload, Users, X
} from "@/components/icons";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { resolveUserRole } from "@/lib/use-user-role";
import {
  defaultGallery, defaultNavigation, defaultPages, defaultSettings,
  articles as defaultArticles, treatments as defaultTreatments,
  GalleryItem, NavigationItem, SitePage, SiteSettings
} from "@/lib/site-data";

type Tab="overview"|"appointments"|"pages"|"treatments"|"articles"|"navigation"|"gallery"|"settings"|"media";
type RecordRow=Record<string,any>;

const tabs:{key:Tab;label:string;icon:ReactNode}[]=[
  {key:"overview",label:"Overview",icon:<LayoutDashboard/>},
  {key:"appointments",label:"Appointments",icon:<CalendarDays/>},
  {key:"pages",label:"Pages",icon:<FileText/>},
  {key:"treatments",label:"Treatments",icon:<Stethoscope/>},
  {key:"articles",label:"Articles",icon:<FileText/>},
  {key:"navigation",label:"Navigation",icon:<Menu/>},
  {key:"gallery",label:"Gallery",icon:<Images/>},
  {key:"settings",label:"Site settings",icon:<Settings/>},
  {key:"media",label:"Media library",icon:<Upload/>}
];

export default function Admin(){
  const [allowed,setAllowed]=useState(false);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [tab,setTab]=useState<Tab>("overview");
  const [menuOpen,setMenuOpen]=useState(false);
  const [appointments,setAppointments]=useState<RecordRow[]>([]);
  const [treatments,setTreatments]=useState<RecordRow[]>([]);
  const [articles,setArticles]=useState<RecordRow[]>([]);
  const [pages,setPages]=useState<SitePage[]>(defaultPages);
  const [navigation,setNavigation]=useState<NavigationItem[]>(defaultNavigation);
  const [gallery,setGallery]=useState<GalleryItem[]>(defaultGallery);
  const [settings,setSettings]=useState<SiteSettings>(defaultSettings);
  const router=useRouter();

  async function load(){
    const s=getSupabase();
    if(!s){setLoading(false);return}
    const {data:{user}}=await s.auth.getUser();
    if(!user){router.replace("/login");return}
    const roleResult=await resolveUserRole(s,user.id);
    if(roleResult.error){setMessage(`Could not verify your administrator role: ${roleResult.error}`);setLoading(false);return}
    if(roleResult.role!=="admin"){setMessage(`Signed in as patient (${user.email}). Promote this exact account in Supabase, then refresh this page.`);setLoading(false);return}
    setAllowed(true);
    const results=await Promise.all([
      s.from("appointments").select("*").order("created_at",{ascending:false}),
      s.from("treatments").select("*").order("sort_order"),
      s.from("articles").select("*").order("published_at",{ascending:false}),
      s.from("site_pages").select("*").order("page_key"),
      s.from("navigation_items").select("*").order("sort_order"),
      s.from("gallery_items").select("*").order("sort_order"),
      s.from("site_settings").select("*").eq("key","general").maybeSingle()
    ]);
    setAppointments(results[0].data||[]);
    setTreatments(results[1].data?.length?results[1].data:defaultTreatments);
    setArticles(results[2].data?.length?results[2].data:defaultArticles);
    if(results[3].data?.length)setPages(results[3].data);
    if(results[4].data?.length)setNavigation(results[4].data);
    if(results[5].data?.length)setGallery(results[5].data);
    if(results[6].data?.value)setSettings({...defaultSettings,...results[6].data.value});
    const missing=results.slice(3,6).filter(r=>r.error).map(r=>r.error?.message);
    if(missing.length)setMessage("CMS upgrade tables are not installed yet. Run supabase/upgrade_v2.sql once, then refresh this page.");
    setLoading(false);
  }
  useEffect(()=>{load()},[]);

  if(loading)return <section className="auth-shell"><div className="admin-loader"><span/><p>Checking administrator access…</p></div></section>;
  if(!isSupabaseConfigured)return <Denied title="Supabase setup required" text="Add the environment variables and run the included Supabase schema."/>;
  if(!allowed)return <Denied title="Admin access not active" text={message||"This account does not have the admin role."}/>;

  const current=tabs.find(item=>item.key===tab)!;
  return <section className="admin-shell">
    <aside className={`admin-sidebar ${menuOpen?"open":""}`}>
      <div className="admin-logo"><Image src={settings.logo_url} width={190} height={65} alt={settings.doctor_name}/><button onClick={()=>setMenuOpen(false)}><X/></button></div>
      <div className="admin-label">CONTENT MANAGEMENT</div>
      <nav>{tabs.map(item=><button className={tab===item.key?"active":""} key={item.key} onClick={()=>{setTab(item.key);setMenuOpen(false)}}>{item.icon}<span>{item.label}</span></button>)}</nav>
      <div className="admin-sidebar-bottom"><Link href="/">View website</Link><button onClick={async()=>{await getSupabase()?.auth.signOut();router.push("/login")}}><LogOut/>Sign out</button></div>
    </aside>
    <div className="admin-main">
      <header className="admin-top"><button className="admin-menu-button" onClick={()=>setMenuOpen(true)}><Menu/></button><div><span>ADMIN PORTAL</span><h1>{current.label}</h1></div><Link className="button button-small button-ghost" href="/">View live site</Link></header>
      {message&&<div className="admin-notice">{message}<button onClick={()=>setMessage("")}><X/></button></div>}
      <div className="admin-workspace">
        {tab==="overview"&&<Overview appointments={appointments} treatments={treatments} articles={articles} pages={pages}/>}
        {tab==="appointments"&&<Appointments items={appointments} reload={load}/>}
        {tab==="pages"&&<PagesManager items={pages} reload={load}/>}
        {tab==="treatments"&&<CollectionManager type="treatments" items={treatments} reload={load}/>}
        {tab==="articles"&&<CollectionManager type="articles" items={articles} reload={load}/>}
        {tab==="navigation"&&<NavigationManager items={navigation} reload={load}/>}
        {tab==="gallery"&&<GalleryManager items={gallery} reload={load}/>}
        {tab==="settings"&&<SettingsManager value={settings} reload={load}/>}
        {tab==="media"&&<MediaManager/>}
      </div>
    </div>
  </section>;
}

function Denied({title,text}:{title:string;text:string}){
  return <section className="auth-shell"><div className="auth-card"><h1>{title}</h1><p>{text}</p><div className="admin-denied-actions"><Link className="button" href="/login">Sign in again</Link><Link className="button button-ghost" href="/portal">Patient portal</Link></div></div></section>;
}

function Overview({appointments,treatments,articles,pages}:{appointments:RecordRow[];treatments:RecordRow[];articles:RecordRow[];pages:SitePage[]}){
  const cards=[
    [appointments.filter(x=>x.status==="new").length,"New requests",<CalendarDays key="a"/>],
    [appointments.length,"All appointments",<Users key="u"/>],[pages.length,"Editable pages",<FileText key="p"/>],
    [treatments.length+articles.length,"Published content",<Stethoscope key="c"/>]
  ];
  return <><div className="admin-welcome"><div><span>WELCOME BACK</span><h2>Everything on the website, in one place.</h2><p>Update page copy, navigation, treatments, articles, gallery images and clinic details. Changes appear on the public site after saving.</p></div><Link href="/booking" className="button">Create test booking</Link></div><div className="admin-stat-grid">{cards.map(([value,label,icon])=><article key={String(label)}><span>{icon}</span><strong>{String(value)}</strong><small>{label}</small></article>)}</div></>;
}

function Appointments({items,reload}:{items:RecordRow[];reload:()=>void}){
  async function change(id:string,status:string){await getSupabase()?.from("appointments").update({status,updated_at:new Date().toISOString()}).eq("id",id);reload()}
  return <Panel title="Appointment requests" subtitle="Review every request and update the confirmation status."><div className="admin-table">{items.length?items.map(x=><div className="admin-table-row appointment-admin-row" key={x.id}><div><b>{x.full_name}</b><small>{x.mobile_number} · {x.email||"No email"}</small></div><div><b>{x.appointment_date}</b><small>{x.preferred_time} · {x.consultation_type}</small></div><p>{x.symptoms}</p><select value={x.status} onChange={e=>change(x.id,e.target.value)}><option>new</option><option>confirmed</option><option>completed</option><option>cancelled</option></select></div>):<Empty text="No appointment requests yet."/>}</div></Panel>;
}

function PagesManager({items,reload}:{items:SitePage[];reload:()=>void}){
  const [editing,setEditing]=useState<SitePage|null>(null);
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);
    let content={};try{content=JSON.parse(String(fd.get("content")||"{}"))}catch{return alert("Additional content must be valid JSON.")}
    const payload={page_key:String(fd.get("page_key")),eyebrow:String(fd.get("eyebrow")),title:String(fd.get("title")),description:String(fd.get("description")),content,published:fd.get("published")==="on",updated_at:new Date().toISOString()};
    const {error}=await getSupabase()!.from("site_pages").upsert(payload,{onConflict:"page_key"});if(error)return alert(error.message);setEditing(null);reload();
  }
  return <Panel title="Website pages" subtitle="Edit the headings, descriptions and section copy for every public page." action={<button className="button button-small" onClick={()=>setEditing({page_key:"",title:"",eyebrow:"",description:"",content:{},published:true})}><Plus/>New page</button>}>
    {editing&&<Editor title={`Edit ${editing.page_key||"page"}`} onClose={()=>setEditing(null)}><form className="admin-form admin-form-grid" onSubmit={save}><Field label="Page key"><input name="page_key" defaultValue={editing.page_key} readOnly={Boolean(editing.id)} required/></Field><Field label="Eyebrow"><input name="eyebrow" defaultValue={editing.eyebrow}/></Field><Field label="Page title" full><input name="title" defaultValue={editing.title} required/></Field><Field label="Description" full><textarea name="description" rows={3} defaultValue={editing.description}/></Field><Field label="Additional section content (JSON)" full><textarea className="code-input" name="content" rows={11} defaultValue={JSON.stringify(editing.content||{},null,2)}/></Field><Toggle name="published" label="Published" checked={editing.published!==false}/><SaveButtons/></form></Editor>}
    <div className="content-list">{items.map(item=><ContentRow key={item.page_key} title={item.title} meta={`/${item.page_key==="home"?"":item.page_key}`} published={item.published!==false} onEdit={()=>setEditing(item)}/>)}</div>
  </Panel>;
}

function CollectionManager({type,items,reload}:{type:"treatments"|"articles";items:RecordRow[];reload:()=>void}){
  const [editing,setEditing]=useState<RecordRow|null>(null);
  const isTreatment=type==="treatments";
  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();const fd=new FormData(e.currentTarget);
    const base={title:String(fd.get("title")),slug:String(fd.get("slug")),excerpt:String(fd.get("excerpt")),image_url:String(fd.get("image_url")),published:fd.get("published")==="on",updated_at:new Date().toISOString()};
    const split=(name:string)=>String(fd.get(name)||"").split("\n").map(x=>x.trim()).filter(Boolean);
    const payload=isTreatment?{...base,eyebrow:String(fd.get("eyebrow")),symptoms:split("symptoms"),evaluations:split("evaluations"),treatments:split("treatments"),preparation:split("preparation"),recovery:String(fd.get("recovery")),urgent_signs:split("urgent_signs"),sort_order:Number(fd.get("sort_order")||0)}:{...base,category:String(fd.get("category")),reading_minutes:Number(fd.get("reading_minutes")||5),content:String(fd.get("content")),published_at:editing?.published_at||new Date().toISOString()};
    const table:any=getSupabase()!.from(type);const result=editing?.id?await table.update(payload).eq("id",editing.id):await table.insert(payload);if(result.error)return alert(result.error.message);setEditing(null);reload();
  }
  async function remove(item:RecordRow){if(!confirm(`Delete "${item.title}"?`))return;await getSupabase()!.from(type).delete().eq("id",item.id);reload()}
  const blank=isTreatment?{title:"",slug:"",excerpt:"",image_url:"",eyebrow:"",symptoms:[],evaluations:[],treatments:[],preparation:[],recovery:"",urgent_signs:[],published:true,sort_order:items.length+1}:{title:"",slug:"",excerpt:"",image_url:"",category:"Health",content:"",reading_minutes:5,published:true};
  return <Panel title={isTreatment?"Treatments":"Health articles"} subtitle={isTreatment?"Edit every treatment detail, preparation step and warning sign.":"Create and edit the complete health library."} action={<button className="button button-small" onClick={()=>setEditing(blank)}><Plus/>Add new</button>}>
    {editing&&<Editor title={`${editing.id?"Edit":"Add"} ${isTreatment?"treatment":"article"}`} onClose={()=>setEditing(null)}><form className="admin-form admin-form-grid" onSubmit={save}><Field label="Title"><input name="title" defaultValue={editing.title} required/></Field><Field label="URL slug"><input name="slug" defaultValue={editing.slug} required/></Field><Field label={isTreatment?"Category label":"Category"}><input name={isTreatment?"eyebrow":"category"} defaultValue={editing.eyebrow||editing.category} required/></Field><Field label={isTreatment?"Sort order":"Reading minutes"}><input type="number" name={isTreatment?"sort_order":"reading_minutes"} defaultValue={editing.sort_order||editing.reading_minutes||0}/></Field><Field label="Image URL" full><input name="image_url" defaultValue={editing.image_url} required/></Field><Field label="Short summary" full><textarea name="excerpt" rows={3} defaultValue={editing.excerpt} required/></Field>
    {isTreatment?<><ListField name="symptoms" label="When to consult" values={editing.symptoms}/><ListField name="evaluations" label="Diagnosis & evaluation" values={editing.evaluations}/><ListField name="treatments" label="Treatment options" values={editing.treatments}/><ListField name="preparation" label="How to prepare" values={editing.preparation}/><Field label="Recovery & follow-up" full><textarea name="recovery" rows={4} defaultValue={editing.recovery}/></Field><ListField name="urgent_signs" label="Urgent warning signs" values={editing.urgent_signs}/></>:<Field label="Full article content" full><textarea name="content" rows={14} defaultValue={editing.content} required/></Field>}
    <Toggle name="published" label="Published" checked={editing.published!==false}/><SaveButtons/></form></Editor>}
    <div className="content-list">{items.map(item=><ContentRow key={item.id} title={item.title} meta={`/${type}/${item.slug}`} published={item.published} image={item.image_url} onEdit={()=>setEditing(item)} onDelete={()=>remove(item)}/>)}</div>
  </Panel>;
}

function NavigationManager({items,reload}:{items:NavigationItem[];reload:()=>void}){
  const [editing,setEditing]=useState<NavigationItem|null>(null);
  async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();const fd=new FormData(e.currentTarget);const payload={label:String(fd.get("label")),href:String(fd.get("href")),location:String(fd.get("location")),sort_order:Number(fd.get("sort_order")),visible:fd.get("visible")==="on"};const s=getSupabase()!;const result=editing?.id?await s.from("navigation_items").update(payload).eq("id",editing.id):await s.from("navigation_items").insert(payload);if(result.error)return alert(result.error.message);setEditing(null);reload()}
  async function remove(item:NavigationItem){if(item.id&&confirm(`Remove "${item.label}" from navigation?`)){await getSupabase()!.from("navigation_items").delete().eq("id",item.id);reload()}}
  return <Panel title="Navigation menus" subtitle="Control link labels, destinations, order and visibility." action={<button className="button button-small" onClick={()=>setEditing({label:"",href:"/",location:"header",sort_order:items.length+1,visible:true})}><Plus/>Add link</button>}>
    {editing&&<Editor title="Edit navigation item" onClose={()=>setEditing(null)}><form className="admin-form admin-form-grid" onSubmit={save}><Field label="Label"><input name="label" defaultValue={editing.label} required/></Field><Field label="Destination"><input name="href" defaultValue={editing.href} required/></Field><Field label="Location"><select name="location" defaultValue={editing.location}><option value="header">Header</option><option value="footer">Footer</option></select></Field><Field label="Sort order"><input name="sort_order" type="number" defaultValue={editing.sort_order}/></Field><Toggle name="visible" label="Visible" checked={editing.visible}/><SaveButtons/></form></Editor>}
    <div className="content-list">{items.map(item=><ContentRow key={item.id||`${item.label}-${item.href}`} title={item.label} meta={`${item.location} · ${item.href} · position ${item.sort_order}`} published={item.visible} onEdit={()=>setEditing(item)} onDelete={()=>remove(item)}/>)}</div>
  </Panel>;
}

function GalleryManager({items,reload}:{items:GalleryItem[];reload:()=>void}){
  const [editing,setEditing]=useState<GalleryItem|null>(null);
  async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();const fd=new FormData(e.currentTarget);const payload={title:String(fd.get("title")),caption:String(fd.get("caption")),image_url:String(fd.get("image_url")),category:String(fd.get("category")),sort_order:Number(fd.get("sort_order")),published:fd.get("published")==="on"};const s=getSupabase()!;const result=editing?.id?await s.from("gallery_items").update(payload).eq("id",editing.id):await s.from("gallery_items").insert(payload);if(result.error)return alert(result.error.message);setEditing(null);reload()}
  async function remove(item:GalleryItem){if(item.id&&confirm(`Delete "${item.title}"?`)){await getSupabase()!.from("gallery_items").delete().eq("id",item.id);reload()}}
  return <Panel title="Gallery" subtitle="Manage public gallery images and captions." action={<button className="button button-small" onClick={()=>setEditing({title:"",caption:"",image_url:"",category:"Clinic",sort_order:items.length+1,published:true})}><Plus/>Add image</button>}>
    {editing&&<Editor title="Edit gallery item" onClose={()=>setEditing(null)}><form className="admin-form admin-form-grid" onSubmit={save}><Field label="Title"><input name="title" defaultValue={editing.title} required/></Field><Field label="Category"><input name="category" defaultValue={editing.category} required/></Field><Field label="Image URL" full><input name="image_url" defaultValue={editing.image_url} required/></Field><Field label="Caption" full><textarea name="caption" rows={3} defaultValue={editing.caption}/></Field><Field label="Sort order"><input type="number" name="sort_order" defaultValue={editing.sort_order}/></Field><Toggle name="published" label="Published" checked={editing.published}/><SaveButtons/></form></Editor>}
    <div className="gallery-admin-grid">{items.map(item=><article key={item.id||item.title}><div className="gallery-admin-image"><Image src={item.image_url} fill alt={item.title}/></div><div><span>{item.category}</span><h3>{item.title}</h3><p>{item.caption}</p><button onClick={()=>setEditing(item)}><Pencil/>Edit</button>{item.id&&<button className="danger" onClick={()=>remove(item)}><Trash2/>Delete</button>}</div></article>)}</div>
  </Panel>;
}

function SettingsManager({value,reload}:{value:SiteSettings;reload:()=>void}){
  async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();const fd=new FormData(e.currentTarget);const payload=Object.fromEntries([...fd.entries()].map(([k,v])=>[k,String(v)]));const {error}=await getSupabase()!.from("site_settings").upsert({key:"general",value:payload,updated_at:new Date().toISOString()});if(error)return alert(error.message);alert("Site settings saved.");reload()}
  return <Panel title="Global site settings" subtitle="Update the logo and clinic details used across the header, footer and contact areas."><form className="admin-form admin-form-grid settings-form" onSubmit={save}>{Object.entries({logo_url:"Logo image URL",doctor_name:"Doctor name",credentials:"Credentials",phone:"Phone",email:"Email",hospital:"Hospital",location:"Location",hours:"Consultation hours"}).map(([key,label])=><Field label={label} key={key} full={key==="logo_url"||key==="credentials"||key==="hours"}><input name={key} defaultValue={value[key as keyof SiteSettings]} required/></Field>)}<SaveButtons/></form></Panel>;
}

function MediaManager(){
  const [message,setMessage]=useState("");const [files,setFiles]=useState<RecordRow[]>([]);
  async function list(){const {data}=await getSupabase()!.storage.from("site-media").list("",{limit:100,sortBy:{column:"created_at",order:"desc"}});setFiles(data||[])}
  useEffect(()=>{list()},[]);
  async function upload(e:FormEvent<HTMLFormElement>){e.preventDefault();const file=new FormData(e.currentTarget).get("file") as File;if(!file)return;const path=`${Date.now()}-${file.name.replace(/\s+/g,"-")}`;const {data,error}=await getSupabase()!.storage.from("site-media").upload(path,file);if(error)setMessage(error.message);else if(data){const {data:url}=getSupabase()!.storage.from("site-media").getPublicUrl(data.path);setMessage(`Uploaded: ${url.publicUrl}`);list()}}
  return <Panel title="Media library" subtitle="Upload reusable images, then copy their public URL into any page, treatment, article or gallery item."><form className="media-upload" onSubmit={upload}><input type="file" name="file" accept="image/*" required/><button className="button"><Upload/>Upload image</button></form>{message&&<div className="admin-notice media-message">{message}</div>}<div className="media-grid">{files.map(file=>{const {data}=getSupabase()!.storage.from("site-media").getPublicUrl(file.name);return <button key={file.id||file.name} onClick={()=>navigator.clipboard.writeText(data.publicUrl)} title="Copy image URL"><Image src={data.publicUrl} fill alt={file.name}/><span>Copy URL</span></button>})}</div></Panel>;
}

function Panel({title,subtitle,action,children}:{title:string;subtitle:string;action?:ReactNode;children:ReactNode}){return <section className="admin-panel"><div className="admin-panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>{children}</section>}
function Editor({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){return <div className="editor-card"><div className="editor-head"><h3>{title}</h3><button onClick={onClose} aria-label="Close editor"><X/></button></div>{children}</div>}
function Field({label,full=false,children}:{label:string;full?:boolean;children:ReactNode}){return <label className={full?"full":""}><span>{label}</span>{children}</label>}
function ListField({name,label,values}:{name:string;label:string;values?:string[]}){return <Field label={`${label} — one item per line`} full><textarea name={name} rows={5} defaultValue={(values||[]).join("\n")}/></Field>}
function Toggle({name,label,checked}:{name:string;label:string;checked:boolean}){return <label className="admin-toggle"><input type="checkbox" name={name} defaultChecked={checked}/><span>{label}</span></label>}
function SaveButtons(){return <div className="admin-save full"><button className="button" type="submit">Save changes</button></div>}
function ContentRow({title,meta,published,image,onEdit,onDelete}:{title:string;meta:string;published:boolean;image?:string;onEdit:()=>void;onDelete?:()=>void}){return <article className="content-row">{image&&<div className="content-thumb"><Image src={image} fill alt=""/></div>}<div><h3>{title}</h3><p>{meta}</p></div><span className={`status ${published?"":"draft"}`}>{published?"Published":"Hidden"}</span><button onClick={onEdit}><Pencil/>Edit</button>{onDelete&&<button className="danger" onClick={onDelete}><Trash2/></button>}</article>}
function Empty({text}:{text:string}){return <div className="admin-empty"><FileText/><p>{text}</p></div>}
