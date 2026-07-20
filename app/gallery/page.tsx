"use client";

import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import { useContent } from "@/components/content-provider";

export default function Gallery(){
  const {gallery}=useContent();
  return <><PageHero pageKey="gallery" breadcrumb="Gallery"/><section className="section"><div className="shell public-gallery">{gallery.map(item=><article key={item.id||item.title}><div><Image src={item.image_url} fill alt={item.title} sizes="(max-width: 700px) 100vw, 33vw"/></div><span>{item.category}</span><h2>{item.title}</h2><p>{item.caption}</p></article>)}</div></section></>;
}
