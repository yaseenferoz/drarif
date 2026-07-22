import { TreatmentGrid } from "@/components/data-grids";
import { PageHero } from "@/components/page-hero";

export const metadata = {
  title: "GI & Laparoscopic Treatments",
  description:
    "Explore gastrointestinal, GI oncology, HPB, colorectal and advanced laparoscopic surgical treatments offered by Dr. Arif Raza in Kalaburagi.",
};
export default function Treatments() {
  return (
    <>
      <PageHero pageKey="treatments" breadcrumb="Treatments" />
      <section className="section">
        <div className="shell">
          <TreatmentGrid />
        </div>
      </section>
    </>
  );
}
