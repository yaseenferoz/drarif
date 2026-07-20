"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CalendarDays } from "@/components/icons";
import { useContent } from "@/components/content-provider";

export default function TreatmentDetail(){
  const {slug}=useParams<{slug:string}>();
  const {treatments}=useContent();
  const t=treatments.find(item=>item.slug===slug);
  if(!t) return <section className="page-hero"><div className="shell"><h1>Treatment not found</h1><Link className="text-link" href="/treatments">View all treatments <ArrowRight/></Link></div></section>;
  return <><section className="detail-hero"><div className="shell detail-grid"><div className="detail-image"><Image src={t.image_url} alt={t.title} fill priority sizes="50vw"/></div><div><span className="detail-kicker">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.excerpt}</p><Link className="button" href="/booking"><CalendarDays size={18}/> Request consultation</Link></div></div></section>
  <section className="section"><div className="shell"><div className="detail-content">
    <Panel title="When to consult" items={t.symptoms}/><Panel title="Diagnosis & evaluation" items={t.evaluations}/><Panel title="Treatment options" items={t.treatments}/><Panel title="How to prepare" items={t.preparation}/>
    <div className="detail-panel"><h2>Recovery & follow-up</h2><p>{t.recovery}</p></div><div className="detail-panel urgent-panel"><h2>Warning signs that should not wait</h2><ul>{t.urgent_signs.map(x=><li key={x}>{x}</li>)}</ul></div>
  </div><div className="cta-band"><div><h2>Need a specialist opinion?</h2><p>Bring your reports and questions. We’ll help you understand the next step.</p></div><Link className="button button-light" href="/booking">Book appointment <ArrowRight/></Link></div></div></section></>;
}
function Panel({title,items}:{title:string,items:string[]}){return <div className="detail-panel"><h2>{title}</h2><ul>{items.map(x=><li key={x}>{x}</li>)}</ul></div>}
