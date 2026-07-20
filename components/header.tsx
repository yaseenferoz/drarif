"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, CircleUserRound, Menu, Phone, X } from "./icons";
import { site } from "@/lib/site-data";
import { useContent } from "./content-provider";
import { useUserRole } from "@/lib/use-user-role";

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const {navigation,settings}=useContent();
  const {role}=useUserRole();
  const links=navigation.filter(item=>item.location==="header"&&item.visible).sort((a,b)=>a.sort_order-b.sort_order);
  const accountHref=role==="admin"?"/admin":"/portal";
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
            <Image className="brand-logo" src={settings.logo_url} width={220} height={72} alt={settings.doctor_name} priority/>
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {links.map(item => <Link className={path.startsWith(item.href) ? "active":""} href={item.href} key={`${item.label}-${item.href}`}>{item.label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link className="icon-link" href={accountHref} aria-label={role==="admin"?"Admin dashboard":"Patient portal"} title={role==="admin"?"Admin dashboard":"Patient portal"}><CircleUserRound size={21}/></Link>
            <Link className="button button-small" href="/booking"><CalendarDays size={17}/> Book visit</Link>
            <button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button>
          </div>
        </div>
        {open && <nav className="mobile-nav">{links.map(item=><Link onClick={()=>setOpen(false)} href={item.href} key={`${item.label}-${item.href}`}>{item.label}</Link>)}<Link onClick={()=>setOpen(false)} href={accountHref}>{role==="admin"?"Admin dashboard":"Patient portal"}</Link><Link onClick={()=>setOpen(false)} href="/booking">Book appointment</Link></nav>}
      </header>
    </>
  );
}
