"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, CircleUserRound, Menu, Phone, X } from "./icons";
import { site } from "@/lib/site-data";

const links = [["About","/about"],["Treatments","/treatments"],["Health library","/articles"],["Contact","/contact"]];

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <>
      <div className="topbar">
        <div className="shell topbar-inner">
          <span>Advanced digestive surgery · Kalaburagi</span>
          <div><span className="topbar-hours">Mon–Sat · 9 AM–7 PM</span><a href={`tel:${site.phoneHref}`}><Phone size={14}/> {site.phone}</a></div>
        </div>
      </div>
      <header className="header">
        <div className="shell header-inner">
          <Link href="/" className="brand" aria-label="Dr. Arif Raza home">
            <span className="brand-mark"><HeartMark /></span>
            <span><strong>Dr. Arif Raza</strong><small>GI · HPB · Laparoscopic Surgeon</small></span>
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {links.map(([label, href]) => <Link className={path.startsWith(href) ? "active":""} href={href} key={href}>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link className="icon-link" href="/portal" aria-label="Patient portal"><CircleUserRound size={21}/></Link>
            <Link className="button button-small" href="/booking"><CalendarDays size={17}/> Book visit</Link>
            <button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button>
          </div>
        </div>
        {open && <nav className="mobile-nav">{links.map(([label, href])=><Link onClick={()=>setOpen(false)} href={href} key={href}>{label}</Link>)}<Link href="/portal">Patient portal</Link><Link href="/booking">Book appointment</Link></nav>}
      </header>
    </>
  );
}

function HeartMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 41S7 31 7 18.5C7 11 16 7 24 15c8-8 17-4 17 3.5C41 31 24 41 24 41Z" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M12 25h7l3-7 4 13 3-6h7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
