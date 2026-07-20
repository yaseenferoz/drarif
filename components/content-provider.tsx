"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { articles as defaultsArticles, treatments as defaultsTreatments, Article, Treatment } from "@/lib/site-data";
import { getSupabase } from "@/lib/supabase";

type ContentState = { treatments: Treatment[]; articles: Article[]; loading: boolean; refresh:()=>Promise<void> };
const ContentContext = createContext<ContentState>({treatments:defaultsTreatments, articles:defaultsArticles, loading:false, refresh:async()=>{}});

export function ContentProvider({children}:{children:ReactNode}) {
  const [treatments,setTreatments]=useState(defaultsTreatments);
  const [articles,setArticles]=useState(defaultsArticles);
  const [loading,setLoading]=useState(true);
  async function refresh(){
    const supabase=getSupabase();
    if(supabase){
      const [t,a]=await Promise.all([
        supabase.from("treatments").select("*").eq("published",true).order("sort_order"),
        supabase.from("articles").select("*").eq("published",true).order("published_at",{ascending:false})
      ]);
      if(t.data?.length) setTreatments(t.data);
      if(a.data?.length) setArticles(a.data);
    }
    setLoading(false);
  }
  useEffect(()=>{refresh()},[]);
  return <ContentContext.Provider value={{treatments,articles,loading,refresh}}>{children}</ContentContext.Provider>;
}
export const useContent=()=>useContext(ContentContext);
