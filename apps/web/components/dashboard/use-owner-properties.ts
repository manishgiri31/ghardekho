"use client";

import { useCallback, useEffect, useState } from "react";
import type { OwnerPropertyListSuccess } from "@ghardekho/types";
import { ApiError } from "@/lib/api/client";
import { getMyProperties } from "@/lib/api/properties";
import { useAuth } from "@/components/auth/auth-provider";

export function useOwnerProperties(limit: number) {
  const { refresh } = useAuth();
  const [data,setData]=useState<OwnerPropertyListSuccess|null>(null);
  const [error,setError]=useState(""); const [unauthorized,setUnauthorized]=useState(false); const [loading,setLoading]=useState(true); const [page,setPage]=useState(1);
  const load=useCallback(async(nextPage:number)=>{
    setLoading(true);setError("");setUnauthorized(false);
    try{setData(await getMyProperties({page:nextPage,limit}));}
    catch(cause){setError(cause instanceof Error?cause.message:"Could not load your properties.");if(cause instanceof ApiError&&cause.status===401){setUnauthorized(true);void refresh();}}
    finally{setLoading(false);}
  },[limit,refresh]);
  useEffect(()=>{const timer=window.setTimeout(()=>{void load(page);},0);return()=>window.clearTimeout(timer);},[load,page]);
  return {data,error,unauthorized,loading,page,setPage,retry:()=>load(page)};
}
