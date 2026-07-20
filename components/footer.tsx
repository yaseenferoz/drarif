"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "./icons";
import { useContent } from "./content-provider";

export function Footer() {
  const {settings,navigation}=useContent();
  const footerLinks=navigation.filter(item=>item.location==="footer"&&item.visible).sort((a,b)=>a.sort_order-b.sort_order);
  const links=footerLinks.length?footerLinks:navigation.filter(item=>item.location==="header"&&item.visible).slice(0,5);
  return <footer className="footer">
    <div className="shell footer-grid">
      <div><span className="footer-logo-wrap"><Image className="footer-logo" src={settings.logo_url} width={210} height={75} alt={settings.doctor_name}/></span><p>{settings.credentials}, offering considered, evidence-based care in {settings.location}.</p></div>
      <div><h3>Explore</h3>{links.map(item=><Link href={item.href} key={`${item.label}-${item.href}`}>{item.label}</Link>)}<Link href="/booking">Book appointment</Link></div>
      <div><h3>Visit</h3><p><MapPin size={16}/>{settings.hospital}, {settings.location}</p><a href={`tel:${settings.phone.replace(/\s/g,"")}`}><Phone size={16}/>{settings.phone}</a><a href={`mailto:${settings.email}`}><Mail size={16}/>{settings.email}</a></div>
      <div className="footer-callout"><span>Need an appointment?</span><strong>Speak with our care team.</strong><a className="button button-light" href={`tel:${settings.phone.replace(/\s/g,"")}`}>Call clinic</a></div>
    </div>
    <div className="shell footer-bottom"><span>© 2026 Dr. Arif Raza. Patient education only; not a substitute for consultation.</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/admin">Admin</Link></div></div>
  </footer>
}
