import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "./icons";
import type { Treatment } from "@/lib/site-data";

export function TreatmentCard({ treatment }: { treatment: Treatment }) {
  return <Link href={`/treatments/${treatment.slug}`} className="treatment-card">
    <div className="card-image"><Image src={treatment.image_url} alt="" fill sizes="(max-width: 700px) 100vw, 33vw"/></div>
    <div className="card-body"><span>{treatment.eyebrow}</span><h3>{treatment.title}</h3><p>{treatment.excerpt}</p><b>Explore care <ArrowRight size={17}/></b></div>
  </Link>
}
