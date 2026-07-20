"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
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

export function ContentProvider({children}:{children:ReactNode}) {
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
      if(t.data?.length){const bySlug=new Map(t.data.map(row=>[row.slug,row]));setTreatments([...defaultsTreatments.map(item=>bySlug.get(item.slug)||item),...t.data.filter(row=>!defaultsTreatments.some(item=>item.slug===row.slug))].filter(item=>item.published!==false));}
      if(a.data?.length){const bySlug=new Map(a.data.map(row=>[row.slug,row]));setArticles([...defaultsArticles.map(item=>bySlug.get(item.slug)||item),...a.data.filter(row=>!defaultsArticles.some(item=>item.slug===row.slug))].filter(item=>item.published!==false));}
      if(p.data?.length) setPages(defaultPages.map(item=>p.data.find(row=>row.page_key===item.page_key) || item));
      if(n.data?.length) setNavigation(n.data);
      if(g.data?.length) setGallery([...g.data, ...defaultGallery.filter(item=>!g.data.some(row=>row.image_url===item.image_url))]);
      if(s.data?.value) setSettings({...defaultSettings,...s.data.value});
    }
    setLoading(false);
  }
  useEffect(()=>{refresh()},[]);
  const page=(key:string)=>pages.find(p=>p.page_key===key) || defaultPages.find(p=>p.page_key===key) || defaultPages[0];
  return <ContentContext.Provider value={{treatments,articles,pages,navigation,gallery,settings,loading,refresh,page}}>{children}</ContentContext.Provider>;
}
export const useContent=()=>useContext(ContentContext);
