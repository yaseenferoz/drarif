"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export type UserRole = "admin" | "patient" | null;

export async function resolveUserRole(supabase: any, userId: string) {
  const adminCheck = await supabase.rpc("is_admin");
  if (!adminCheck.error && adminCheck.data === true) {
    return { role: "admin" as const, error: null };
  }

  const profile = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return {
    role: profile.data?.role === "admin" ? "admin" as const : "patient" as const,
    error: profile.error?.message || null
  };
}

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
      const result=await resolveUserRole(supabase,user.id);
      setRole(result.role);
      setLoading(false);
    });
  },[]);
  return {role,email,loading};
}
