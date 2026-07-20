"use client";

import { useContent } from "./content-provider";

export function HomeHeroCopy(){
  const data=useContent().page("home");
  return <><div className="availability"><span/> {data.eyebrow}</div><h1>{data.title}</h1><p>{data.description}</p></>;
}

export function HomeSectionCopy({field,fallback}:{field:string;fallback:string}){
  const value=useContent().page("home").content?.[field] || fallback;
  return <>{value}</>;
}

export function AboutMainCopy(){
  const data=useContent().page("about");
  return <><span className="eyebrow">{data.eyebrow}</span><h2>{data.content.heading||data.title}</h2><p>{data.content.body||data.description}</p>{data.content.secondary&&<p>{data.content.secondary}</p>}</>;
}

export function BookingAsideCopy(){
  const data=useContent().page("booking");
  return <><span className="eyebrow">{data.eyebrow}</span><h2>{data.content.aside_title||data.title}</h2><p>{data.content.aside_text||data.description}</p></>;
}

export function LegalPageCopy({pageKey}:{pageKey:"privacy"|"terms"}){
  const data=useContent().page(pageKey);
  return <><span className="eyebrow">{data.eyebrow}</span><h2>{data.title}</h2><p>{data.content.body||data.description}</p></>;
}

export function ClinicDetails({mode}:{mode:"contact"|"booking"}){
  const {settings}=useContent();
  if(mode==="booking")return <><div className="mini-contact"><span className="contact-symbol">☎</span><div><small>Direct booking</small><a href={`tel:${settings.phone.replace(/\s/g,"")}`}>{settings.phone}</a></div></div><div className="mini-contact" style={{marginTop:22}}><span className="contact-symbol">◷</span><div><small>Consultation hours</small><a>{settings.hours}</a></div></div></>;
  return <div className="contact-cards">
    <a className="contact-card" href={`tel:${settings.phone.replace(/\s/g,"")}`}><span className="contact-symbol">☎</span><div><small>Appointment desk</small><strong>{settings.phone}</strong></div></a>
    <a className="contact-card" href={`mailto:${settings.email}`}><span className="contact-symbol">✉</span><div><small>Email</small><strong>{settings.email}</strong></div></a>
    <div className="contact-card"><span className="contact-symbol">⌖</span><div><small>Hospital</small><strong>{settings.hospital}, {settings.location}</strong></div></div>
    <div className="contact-card"><span className="contact-symbol">◷</span><div><small>Consultation hours</small><strong>{settings.hours}</strong></div></div>
  </div>;
}
