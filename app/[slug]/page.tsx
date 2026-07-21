"use client";

import { useParams } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { useContent } from "@/components/content-provider";
import Link from "next/link";

function ContentValue({value}:{value:unknown}){
  if(typeof value==="string"||typeof value==="number"||typeof value==="boolean") return <p>{String(value)}</p>;
  if(Array.isArray(value)) return <ul>{value.map((item,index)=><li key={`${String(item)}-${index}`}>{typeof item==="object"&&item!==null?<ContentValue value={item}/>:String(item)}</li>)}</ul>;
  if(value&&typeof value==="object") return <div className="cms-json-grid">{Object.entries(value as Record<string,unknown>).map(([key,item])=><div key={key}><b>{key.replace(/[_-]/g," ")}</b><ContentValue value={item}/></div>)}</div>;
  return null;
}

export default function CmsPage(){
  const {slug}=useParams<{slug:string}>();
  const {pages}=useContent();
  const data=pages.find(item=>item.page_key===slug);
  if(!data) return <main className="not-found-page"><p className="eyebrow">DR. ARIF RAZA</p><h1>That page could not be found.</h1><p>Let’s get you back to specialist digestive care.</p><Link className="button" href="/">Back to home</Link></main>;
  const content=data.content||{};
  return <><PageHero pageKey={slug} breadcrumb={data.title||slug}/><section className="section cms-page-section"><div className="shell cms-page-content">{content.rich_html?<div className="cms-content-card rich-content" dangerouslySetInnerHTML={{__html:String(content.rich_html)}}/>:<div className="cms-content-card"><ContentValue value={content}/></div>}</div></section></>;
}
