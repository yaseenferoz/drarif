import { ArticleGrid } from "@/components/data-grids";
import { PageHero } from "@/components/page-hero";
export const metadata={title:"Health Library"};
export default function Articles(){return <><PageHero pageKey="articles" breadcrumb="Health library"/><section className="section"><div className="shell"><ArticleGrid/></div></section></>}
