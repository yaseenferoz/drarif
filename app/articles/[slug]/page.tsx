"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays } from "@/components/icons";
import { useContent } from "@/components/content-provider";
export default function Article(){
  const {slug}=useParams<{slug:string}>();const {articles}=useContent();const a=articles.find(x=>x.slug===slug);
  if(!a)return <section className="page-hero"><div className="shell"><h1>Article not found</h1></div></section>;
  return <><section className="page-hero"><div className="shell"><span className="breadcrumb">{a.category} · {a.reading_minutes} min read</span><h1>{a.title}</h1><p>{a.excerpt}</p></div></section><section className="section"><article className="shell" style={{maxWidth:820}}><div className="detail-image" style={{marginBottom:45}}><Image src={a.image_url} alt="" fill sizes="800px"/></div><div className="prose">{a.content.split("\n\n").map((p,i)=><p key={i}>{p}</p>)}</div><div className="cta-band"><div><h2>Have a health concern?</h2><p>Online information cannot replace a personal assessment.</p></div><Link className="button button-light" href="/booking"><CalendarDays size={18}/> Book visit</Link></div></article></section></>
}
