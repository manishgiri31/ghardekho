"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { PropertyRecord } from "@ghardekho/types";
import { PropertyForm } from "@/components/dashboard/property-form";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiError } from "@/lib/api/client";
import { getProperty } from "@/lib/api/properties";

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>(); const { user } = useAuth();
  const [property,setProperty]=useState<PropertyRecord|null>(null); const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
  useEffect(()=>{let current=true;getProperty(id).then(({data})=>{if(!current)return;if(data.ownerId!==user?.id){setError("You do not have access to edit this listing.");return;}setProperty(data);}).catch((cause)=>{if(current)setError(cause instanceof ApiError&&cause.status===404?"This listing could not be found or is not available to your account.":cause instanceof Error?cause.message:"Could not load this listing.");}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[id,user?.id]);
  if(loading)return <div role="status" className="py-16 text-sm text-muted">Loading your listing…</div>;
  if(error||!property)return <section className="border border-line bg-white p-7"><h1 className="text-xl font-semibold">Listing unavailable</h1><p className="mt-3 text-sm leading-6 text-muted">{error||"This listing could not be loaded."}</p></section>;
  return <><p className="eyebrow">Update listing</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit property</h1><p className="mb-7 mt-3 text-sm text-muted">Your changes are checked by the same API permissions as the listing itself.</p><PropertyForm mode="edit" property={property}/></>;
}
