import Link from "next/link";
import { Mail, MapPin, Phone } from "./icons";
import { site } from "@/lib/site-data";

export function Footer() {
  return <footer className="footer">
    <div className="shell footer-grid">
      <div><div className="footer-brand">Dr. Arif Raza<span>Specialist digestive care, closer to home.</span></div><p>{site.credentials}, offering considered, evidence-based care in Kalaburagi.</p></div>
      <div><h3>Explore</h3><Link href="/about">About doctor</Link><Link href="/treatments">Treatments</Link><Link href="/articles">Health library</Link><Link href="/booking">Book appointment</Link></div>
      <div><h3>Visit</h3><p><MapPin size={16}/>{site.hospital}, {site.location}</p><a href={`tel:${site.phoneHref}`}><Phone size={16}/>{site.phone}</a><a href={`mailto:${site.email}`}><Mail size={16}/>{site.email}</a></div>
      <div className="footer-callout"><span>Need an appointment?</span><strong>Speak with our care team.</strong><a className="button button-light" href={`tel:${site.phoneHref}`}>Call clinic</a></div>
    </div>
    <div className="shell footer-bottom"><span>© 2026 Dr. Arif Raza. Patient education only; not a substitute for consultation.</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/admin">Admin</Link></div></div>
  </footer>
}
