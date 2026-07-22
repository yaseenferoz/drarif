import { ArticleGrid } from "@/components/data-grids";
import { PageHero } from "@/components/page-hero";
export const metadata = {
  title: "Digestive Health Library",
  description:
    "Doctor-reviewed digestive health information from Dr. Arif Raza, covering symptoms, investigations, surgery and recovery.",
};
export default function Articles() {
  return (
    <>
      <PageHero pageKey="articles" breadcrumb="Health library" />
      <section className="section">
        <div className="shell">
          <ArticleGrid />
        </div>
      </section>
    </>
  );
}
