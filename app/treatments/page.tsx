import { TreatmentGrid } from "@/components/data-grids";

export const metadata={title:"Treatments"};
export default function Treatments(){
  return <><section className="page-hero"><div className="shell"><span className="breadcrumb">Home / Treatments</span><h1>Specialist care for<br/>digestive conditions.</h1><p>Explore diagnostic, endoscopic and surgical options. The right plan is decided only after a detailed consultation and review of your reports.</p></div></section><section className="section"><div className="shell"><TreatmentGrid/></div></section></>;
}
