"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export type UserRole = "admin" | "patient" | null;

export function useUserRole() {
  const [role,setRole]=useState<UserRole>(null);
  const [email,setEmail]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const supabase=getSupabase();
    if(!supabase){setLoading(false);return}
    supabase.auth.getUser().then(async({data:{user}})=>{
      if(!user){setLoading(false);return}
      setEmail(user.email || "");
      const {data,error}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
      if(!error && data?.role==="admin") setRole("admin");
      else setRole("patient");
      setLoading(false);
    });
  },[]);
  return {role,email,loading};
}
