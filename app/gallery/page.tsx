"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { useContent } from "@/components/content-provider";
import { X } from "@/components/icons";

export default function Gallery(){
  const {gallery}=useContent();
  const [selected,setSelected]=useState<typeof gallery[number]|null>(null);
  useEffect(()=>{if(!selected)return; const onKey=(event:KeyboardEvent)=>event.key==="Escape"&&setSelected(null); document.addEventListener("keydown",onKey); document.body.style.overflow="hidden"; return ()=>{document.removeEventListener("keydown",onKey);document.body.style.overflow=""}},[selected]);
  return <><PageHero pageKey="gallery" breadcrumb="Gallery"/><section className="section"><div className="shell public-gallery">{gallery.map((item,index)=><article key={item.id||item.image_url||`${item.title}-${index}`}><button className="gallery-image-button" type="button" onClick={()=>setSelected(item)} aria-label={`View ${item.title}`}><Image src={item.image_url} fill alt={item.title} sizes="(max-width: 700px) 100vw, 33vw"/></button><span>{item.category}</span><h2>{item.title}</h2><p>{item.caption}</p></article>)}</div></section>{selected&&<div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={selected.title} onClick={()=>setSelected(null)}><div className="gallery-lightbox-card" onClick={event=>event.stopPropagation()}><button className="gallery-lightbox-close" type="button" onClick={()=>setSelected(null)} aria-label="Close image"><X size={20}/></button><div className="gallery-lightbox-image"><Image src={selected.image_url} fill alt={selected.title} sizes="(max-width: 900px) 92vw, 1100px" priority/></div><div className="gallery-lightbox-copy"><span>{selected.category}</span><h2>{selected.title}</h2><p>{selected.caption}</p></div></div></div>}</>;
}
