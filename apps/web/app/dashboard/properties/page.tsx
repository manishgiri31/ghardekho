"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OwnerPropertyCard } from "@/components/dashboard/owner-property-card";
import { useOwnerProperties } from "@/components/dashboard/use-owner-properties";
import { archiveProperty, restoreProperty } from "@/lib/api/properties";
import { ApiError } from "@/lib/api/client";

const countLabels = [["DRAFT", "Drafts"], ["PUBLISHED", "Published"], ["PENDING_REVIEW", "Under review"], ["ARCHIVED", "Archived"]] as const;

export default function MyPropertiesPage() {
  const { data, error, unauthorized, loading, page, setPage, retry } = useOwnerProperties(10);
  const [archiving, setArchiving] = useState("");
  const [restoring, setRestoring] = useState("");
  const [actionError, setActionError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const status = new URLSearchParams(window.location.search).get("status");
      if (status === "DRAFT") setSaveNotice("Your listing was saved as a draft.");
      if (status === "PENDING_REVIEW") setSaveNotice("Your changes were saved. The listing is now under review.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function archive(id: string, title: string) {
    if (!window.confirm(`Archive “${title}”? This removes it from public search.`)) return;
    setArchiving(id);
    setActionError("");
    try {
      await archiveProperty(id);
      if (data?.data.length === 1 && page > 1) setPage(page - 1);
      else await retry();
    } catch (cause) {
      setActionError(cause instanceof ApiError ? cause.message : "Could not archive this property.");
    } finally {
      setArchiving("");
    }
  }

  async function restore(id: string, title: string) {
    if (!window.confirm(`Restore “${title}” to review? It will remain hidden from public search.`)) return;
    setRestoring(id);
    setActionError("");
    try {
      await restoreProperty(id);
      await retry();
    } catch (cause) {
      setActionError(cause instanceof ApiError ? cause.message : "Could not restore this property.");
    } finally {
      setRestoring("");
    }
  }

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Owner workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">My properties</h1><p className="mt-2 text-sm text-muted">Manage your listings and their review status.</p></div><Link href="/dashboard/properties/new" className="inline-flex h-11 items-center bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-deep">Post a property</Link></div>
    {saveNotice && <p role="status" className="mt-5 border border-forest/20 bg-white px-4 py-3 text-sm text-forest">{saveNotice}</p>}
    {data && <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">{countLabels.map(([key, label]) => <div key={key} className="border border-line bg-white px-4 py-3"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-lg font-semibold">{data.summary.byStatus[key]}</dd></div>)}</dl>}
    {actionError && <p role="alert" className="mt-5 border border-red-200 bg-white p-4 text-sm text-red-800">{actionError}</p>}
    {loading && !data ? <div role="status" className="mt-6 space-y-3">{[0, 1, 2].map((n) => <div key={n} className="h-36 animate-pulse bg-white" />)}</div>
      : error ? <div role="alert" className="mt-6 border border-red-200 bg-white p-6"><h2 className="font-semibold">{unauthorized ? "Your session has expired" : "We couldn’t load your properties"}</h2><p className="mt-2 text-sm text-muted">{error}</p>{!unauthorized && <button onClick={() => void retry()} className="mt-4 text-sm font-semibold text-forest underline">Try again</button>}{unauthorized && <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-forest underline">Log in again</Link>}</div>
        : data?.data.length ? <><section className="mt-6 border border-line bg-white px-5 sm:px-7">{data.data.map((property) => <OwnerPropertyCard key={property.id} property={property} onArchive={() => void archive(property.id, property.title)} onRestore={() => void restore(property.id, property.title)} archiving={archiving === property.id} restoring={restoring === property.id} />)}</section><div className="mt-5 flex items-center justify-between text-sm"><span className="text-muted">Page {data.pagination.page} of {Math.max(1, data.pagination.totalPages)} · {data.pagination.total} properties</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-10 border border-line px-3 disabled:opacity-40">Previous</button><button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="h-10 border border-line px-3 disabled:opacity-40">Next</button></div></div></>
          : <section className="mt-6 border border-line bg-white p-8 text-center sm:p-12"><p className="eyebrow">Your next step</p><h2 className="mt-2 text-xl font-semibold">No properties yet</h2><p className="mt-2 text-sm text-muted">Create your first listing. It will start as a draft and go through review before appearing publicly.</p><Link href="/dashboard/properties/new" className="mt-5 inline-flex h-11 items-center bg-forest px-4 text-sm font-semibold text-white">Post your first property</Link></section>}
  </>;
}
