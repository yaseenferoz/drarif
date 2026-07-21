"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, ChevronDown, CircleUserRound, Menu, Phone, X } from "./icons";
import { site } from "@/lib/site-data";
import { useContent } from "./content-provider";
import { useUserRole } from "@/lib/use-user-role";
import { practiceLogo } from "@/lib/brand";

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const {navigation,settings,treatments,articles,pages}=useContent();
  const {role}=useUserRole();
  const links=navigation.filter(item=>item.location==="header"&&item.visible).sort((a,b)=>a.sort_order-b.sort_order);
  const accountHref=role==="admin"?"/admin":"/portal";
  const logoUrl=practiceLogo(settings.logo_url);
  const menuItems={
    "/treatments":treatments.slice(0,5).map(item=>({label:item.title,href:`/treatments/${item.slug}`})),
    "/articles":articles.slice(0,5).map(item=>({label:item.title,href:`/articles/${item.slug}`}))
  } as Record<string,{label:string;href:string}[]>;
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
            <Image className="brand-logo" src={logoUrl} width={220} height={72} alt={settings.doctor_name} priority/>
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {links.map(item => {
              const inferredPage=pages.find(page=>page.page_key===item.label.toLowerCase().trim().replace(/\s+/g,"-"));
              const href=item.href==="/"&&inferredPage&&inferredPage.page_key!=="home"?`/${inferredPage.page_key}`:item.href;
              const children=menuItems[href];
              const active=href==="/"?path==="/":path.startsWith(href);
              return children ? <div className="nav-menu" key={`${item.label}-${item.href}`}><Link className={active ? "active":""} href={href}>{item.label}<ChevronDown size={14}/></Link><div className="nav-dropdown">{children.map(child=><Link href={child.href} key={child.href}>{child.label}</Link>)}<Link className="nav-dropdown-all" href={href}>View all {item.label.toLowerCase()}</Link></div></div> : <Link className={active ? "active":""} href={href} key={`${item.label}-${item.href}`}>{item.label}</Link>
            })}
          </nav>
          <div className="header-actions">
            <Link className="icon-link" href={accountHref} aria-label={role==="admin"?"Admin dashboard":"Patient portal"} title={role==="admin"?"Admin dashboard":"Patient portal"}><CircleUserRound size={21}/></Link>
            <Link className="button button-small" href="/booking"><CalendarDays size={17}/> Book visit</Link>
            <button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button>
          </div>
        </div>
        {open && <nav className="mobile-nav">{links.map(item=>{const inferred=pages.find(page=>page.page_key===item.label.toLowerCase().trim().replace(/\s+/g,"-"));const href=item.href==="/"&&inferred&&inferred.page_key!=="home"?`/${inferred.page_key}`:item.href;return <div key={`${item.label}-${item.href}`}><Link onClick={()=>setOpen(false)} href={href}>{item.label}</Link>{menuItems[href]?.map(child=><Link className="mobile-subnav-link" onClick={()=>setOpen(false)} href={child.href} key={child.href}>{child.label}</Link>)}</div>})}<Link onClick={()=>setOpen(false)} href={accountHref}>{role==="admin"?"Admin dashboard":"Patient portal"}</Link><Link onClick={()=>setOpen(false)} href="/booking">Book appointment</Link></nav>}
      </header>
    </>
  );
}
