"use client";

import { useParams } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { useContent } from "@/components/content-provider";

function ContentValue({value}:{value:unknown}){
  if(typeof value==="string"||typeof value==="number"||typeof value==="boolean") return <p>{String(value)}</p>;
  if(Array.isArray(value)) return <ul>{value.map((item,index)=><li key={`${String(item)}-${index}`}>{typeof item==="object"&&item!==null?<ContentValue value={item}/>:String(item)}</li>)}</ul>;
  if(value&&typeof value==="object") return <div className="cms-json-grid">{Object.entries(value as Record<string,unknown>).map(([key,item])=><div key={key}><b>{key.replace(/[_-]/g," ")}</b><ContentValue value={item}/></div>)}</div>;
  return null;
}

export default function CmsPage(){
  const {slug}=useParams<{slug:string}>();
  const {page}=useContent();
  const data=page(slug);
  const content=data.content||{};
  return <><PageHero pageKey={slug} breadcrumb={data.title||slug}/><section className="section cms-page-section"><div className="shell cms-page-content"><div className="cms-content-card"><ContentValue value={content}/></div></div></section></>;
}
