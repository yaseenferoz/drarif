import { ArticleGrid } from "@/components/data-grids";
export const metadata={title:"Health Library"};
export default function Articles(){return <><section className="page-hero"><div className="shell"><span className="breadcrumb">Home / Health library</span><h1>Clear guidance for<br/>digestive health.</h1><p>Practical, doctor-reviewed reading to help you recognise symptoms, prepare for procedures and make informed care decisions.</p></div></section><section className="section"><div className="shell"><ArticleGrid/></div></section></>}
