"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { OwnerPropertyCard } from "@/components/dashboard/owner-property-card";
import { useOwnerProperties } from "@/components/dashboard/use-owner-properties";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, unauthorized, loading, retry } = useOwnerProperties(3);
  const counts = data?.summary.byStatus;
  const stats = [["Total properties", data?.summary.total], ["Drafts", counts?.DRAFT], ["Published", counts?.PUBLISHED], ["Under review", counts?.PENDING_REVIEW], ["Archived", counts?.ARCHIVED]] as const;
  return <>
    <p className="eyebrow">Your GharDekho</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Welcome, {user?.profile?.name || "home seeker"}.</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Your account and property activity, gathered in one place.</p>
    {loading && !data ? <div role="status" className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[0,1,2,3,4].map((n) => <div key={n} className="flex h-[92px] flex-col justify-center border border-line bg-white px-4 sm:px-5"><div className="h-3 w-16 animate-pulse rounded-[2px] bg-paper" /><div className="mt-3 h-7 w-8 animate-pulse rounded-[2px] bg-paper" /></div>)}</div>
    : error ? <div role="alert" className="mt-8 border border-red-200 bg-white p-6"><h2 className="font-semibold">{unauthorized ? "Your session has expired" : "Property data is unavailable"}</h2><p className="mt-2 text-sm text-muted">{error}</p>{!unauthorized && <button onClick={() => void retry()} className="mt-4 text-sm font-semibold text-forest underline">Try again</button>}{unauthorized && <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-forest underline">Log in again</Link>}</div>
    : <>
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{stats.map(([label,value]) => <div key={label} className="border border-line bg-white px-4 py-4 sm:px-5"><dt className="text-xs text-muted">{label}</dt><dd className="mt-2 text-2xl font-semibold text-ink">{value ?? 0}</dd></div>)}</dl>
      <section className="mt-9 border border-line bg-white p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Latest activity</p><h2 className="mt-2 text-xl font-semibold">Your properties</h2></div><Link href="/dashboard/properties" className="text-sm font-semibold text-forest underline underline-offset-4">View all properties</Link></div>{data?.data.length ? <div className="mt-5">{data.data.map((property) => <OwnerPropertyCard key={property.id} property={property} compact />)}</div> : <div className="mt-5 border-t border-line py-7"><p className="text-sm text-muted">You haven’t added a property yet.</p><Link href="/dashboard/properties/new" className="mt-3 inline-block text-sm font-semibold text-forest underline">Post your first property</Link></div>}</section>
    </>}
    <div className="mt-7 grid gap-3 sm:grid-cols-2"><Link href="/dashboard/properties/new" className="border border-forest bg-forest px-5 py-5 text-white hover:bg-forest-deep"><span className="text-sm font-semibold">Post a property</span><span className="mt-1 block text-xs text-white/75">Create a listing for review</span></Link><Link href="/dashboard/profile" className="border border-line bg-white px-5 py-5 hover:border-forest/40"><span className="text-sm font-semibold">My profile</span><span className="mt-1 block text-xs text-muted">Review your account details</span></Link></div>
  </>;
}
