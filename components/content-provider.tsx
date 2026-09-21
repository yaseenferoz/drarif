"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  articles as defaultsArticles, treatments as defaultsTreatments, defaultGallery, defaultNavigation,
  defaultPages, defaultSettings, Article, GalleryItem, NavigationItem, SitePage, SiteSettings, Treatment
} from "@/lib/site-data";
import { getSupabase } from "@/lib/supabase";

type ContentState = {
  treatments: Treatment[]; articles: Article[]; pages: SitePage[]; navigation: NavigationItem[];
  gallery: GalleryItem[]; settings: SiteSettings; loading: boolean; refresh:()=>Promise<void>;
  page:(key:string)=>SitePage;
};
const ContentContext = createContext<ContentState>({
  treatments:defaultsTreatments, articles:defaultsArticles, pages:defaultPages, navigation:defaultNavigation,
  gallery:defaultGallery, settings:defaultSettings, loading:false, refresh:async()=>{},
  page:(key)=>defaultPages.find(p=>p.page_key===key) || defaultPages[0]
});

const realImageReplacements: Record<string, string> = {
  "/assets/img/team/gicancer.png": "/assets/img/service/sr-d-1.jpg",
  "/assets/img/team/hernia.png": "/assets/img/service/laprosocopic.png",
  "/assets/img/team/liver.png": "/assets/img/service/sr-d-1.jpg",
  "/assets/img/team/gallbladder.png": "/assets/img/service/laprosocopic.png",
  "/assets/img/lifestyle.png": "/assets/img/service/ser8-5.jpg",
  "/assets/img/whychoosearif.png": "/gallery/IMG-20260613-WA0050.jpg",
};

function withRealImage<T extends { image_url: string }>(item: T): T {
  const replacement = realImageReplacements[item.image_url];
  return replacement ? { ...item, image_url: replacement } : item;
}

export function ContentProvider({children}:{children:ReactNode}) {
  const pathname=usePathname();
  const [treatments,setTreatments]=useState(defaultsTreatments);
  const [articles,setArticles]=useState(defaultsArticles);
  const [pages,setPages]=useState(defaultPages);
  const [navigation,setNavigation]=useState(defaultNavigation);
  const [gallery,setGallery]=useState(defaultGallery);
  const [settings,setSettings]=useState(defaultSettings);
  const [loading,setLoading]=useState(true);
  async function refresh(){
    const supabase=getSupabase();
    if(supabase){
      const [t,a,p,n,g,s]=await Promise.all([
        supabase.from("treatments").select("*").order("sort_order"),
        supabase.from("articles").select("*").order("published_at",{ascending:false}),
        supabase.from("site_pages").select("*").eq("published",true),
        supabase.from("navigation_items").select("*").eq("visible",true).order("sort_order"),
        supabase.from("gallery_items").select("*").eq("published",true).order("sort_order"),
        supabase.from("site_settings").select("*").eq("key","general").maybeSingle()
      ]);
      if(t.data?.length){const normalized=t.data.map(withRealImage);const bySlug=new Map(normalized.map(row=>[row.slug,row]));setTreatments([...defaultsTreatments.map(item=>bySlug.get(item.slug)||item),...normalized.filter(row=>!defaultsTreatments.some(item=>item.slug===row.slug))].filter(item=>item.published!==false));}
      if(a.data?.length){const normalized=a.data.map(withRealImage);const bySlug=new Map(normalized.map(row=>[row.slug,row]));setArticles([...defaultsArticles.map(item=>bySlug.get(item.slug)||item),...normalized.filter(row=>!defaultsArticles.some(item=>item.slug===row.slug))].filter(item=>item.published!==false));}
      if(p.data?.length) setPages([...defaultPages.map(item=>p.data.find(row=>row.page_key===item.page_key) || item),...p.data.filter(row=>!defaultPages.some(item=>item.page_key===row.page_key))]);
      if(n.data?.length) setNavigation(n.data);
      if(g.data?.length) {const normalized=g.data.map(withRealImage);setGallery([...normalized, ...defaultGallery.filter(item=>!normalized.some(row=>row.image_url===item.image_url))]);}
      if(s.data?.value) {
        const savedSettings = {...defaultSettings,...s.data.value};
        if(savedSettings.location === "Kalaburagi, Karnataka") {
          savedSettings.location = defaultSettings.location;
        }
        if(/9(?::00)?\s*AM.*7(?::00)?\s*PM/i.test(savedSettings.hours)) {
          savedSettings.hours = defaultSettings.hours;
        }
        setSettings(savedSettings);
      }
    }
    setLoading(false);
  }
  useEffect(()=>{refresh()},[pathname]);
  const page=(key:string)=>pages.find(p=>p.page_key===key) || defaultPages.find(p=>p.page_key===key) || defaultPages[0];
  return <ContentContext.Provider value={{treatments,articles,pages,navigation,gallery,settings,loading,refresh,page}}>{children}</ContentContext.Provider>;
}
export const useContent=()=>useContext(ContentContext);
