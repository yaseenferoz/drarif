"use client";

import { TreatmentCard } from "./treatment-card";
import { useContent } from "./content-provider";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "./icons";

export function TreatmentGrid({limit}:{limit?:number}) {
  const {treatments}=useContent();
  return <div className="treatment-grid">{treatments.slice(0,limit).map(t=><TreatmentCard treatment={t} key={t.slug}/>)}</div>;
}
export function ArticleGrid({limit}:{limit?:number}) {
  const {articles}=useContent();
  return <div className="article-grid">{articles.slice(0,limit).map(a=><Link className="article-card" href={`/articles/${a.slug}`} key={a.slug}><div className="article-image"><Image src={a.image_url} alt="" fill sizes="(max-width: 800px) 100vw, 33vw"/></div><div><span>{a.category} · {a.reading_minutes} min read</span><h3>{a.title}</h3><p>{a.excerpt}</p><b>Read article <ArrowRight size={16}/></b></div></Link>)}</div>;
}
