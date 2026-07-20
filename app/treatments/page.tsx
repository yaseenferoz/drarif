import { TreatmentGrid } from "@/components/data-grids";
import { PageHero } from "@/components/page-hero";

export const metadata={title:"Treatments"};
export default function Treatments(){
  return <><PageHero pageKey="treatments" breadcrumb="Treatments"/><section className="section"><div className="shell"><TreatmentGrid/></div></section></>;
}
