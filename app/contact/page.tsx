import { PageHero } from "@/components/page-hero";
import { ClinicDetails } from "@/components/dynamic-copy";
export const metadata={title:"Contact"};
export default function Contact(){return <><PageHero pageKey="contact" breadcrumb="Contact"/><section className="section"><div className="shell contact-grid"><ClinicDetails mode="contact"/><iframe className="map" title="NK Hospital Kalaburagi" src="https://www.google.com/maps?q=NK%20Hospital%20Kalaburagi%20Karnataka&output=embed" loading="lazy"/></div></section></>}
