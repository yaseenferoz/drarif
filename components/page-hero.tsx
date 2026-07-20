"use client";

import { useContent } from "./content-provider";

export function PageHero({pageKey, breadcrumb}:{pageKey:string;breadcrumb:string}) {
  const {page}=useContent();
  const data=page(pageKey);
  return <section className="page-hero"><div className="shell">
    <span className="breadcrumb">Home / {breadcrumb}</span>
    <span className="eyebrow page-eyebrow">{data.eyebrow}</span>
    <h1>{data.title}</h1><p>{data.description}</p>
  </div></section>;
}
