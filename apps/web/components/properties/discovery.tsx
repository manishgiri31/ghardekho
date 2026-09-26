"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Bath, Heart, MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { PropertySearchInput } from "@ghardekho/validation";
import type { ApiListSuccess, PublicPropertyRecord } from "@ghardekho/types";
import { ApiError } from "@/lib/api/client";
import { searchProperties } from "@/lib/api/properties";
import { getDiscoveryState, parseDiscoveryQuery, propertyDetailsHref, updateDiscoveryQuery } from "@/lib/property-discovery";

const propertyTypes = [["APARTMENT", "Apartment"], ["HOUSE", "House"], ["VILLA", "Villa"], ["PLOT", "Plot"], ["COMMERCIAL", "Commercial"], ["OFFICE", "Office"], ["SHOP", "Shop"], ["WAREHOUSE", "Warehouse"], ["OTHER", "Other"]];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "area_asc", label: "Area: smallest first" },
  { value: "area_desc", label: "Area: largest first" },
] as const satisfies readonly { value: PropertySearchInput["sort"]; label: string }[];
const baseFilters: PropertySearchInput = { page: 1, limit: 12, sort: "newest" };

const money = (price: string, type: string) => {
  const amount = Number(price);
  const value = amount >= 10_000_000 ? `₹${(amount / 10_000_000).toFixed(amount % 10_000_000 ? 2 : 0)} Cr` : amount >= 100_000 ? `₹${(amount / 100_000).toFixed(amount % 100_000 ? 1 : 0)} L` : `₹${amount.toLocaleString("en-IN")}`;
  return type === "RENT" ? `${value} / month` : value;
};

function PropertyCard({ property }: { property: PublicPropertyRecord }) {
  const photo = property.media?.find((item) => item.isPrimary)?.url ?? property.media?.find((item) => item.type === "IMAGE")?.url;
  const altText = property.media?.find((item) => item.url === photo)?.altText || property.title;
  return <article className="group relative flex flex-col overflow-hidden rounded-[3px] border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:border-line-dark hover:shadow-[0_12px_30px_rgba(5,36,29,.06)]">
    <Link href={propertyDetailsHref(property.slug)} className="flex flex-1 flex-col outline-none">
      <div className="relative aspect-[4/3] overflow-hidden bg-paper">
        {photo ? <Image src={photo} alt={altText} fill unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-sm text-muted">Photos coming soon</div>}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="rounded-[2px] bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-forest shadow-sm backdrop-blur-md">For {property.listingType === "RENT" ? "rent" : "sale"}</span>
          <button onClick={(e) => e.preventDefault()} aria-label="Save home" className="grid size-8 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"><Heart size={15} strokeWidth={2} /></button>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[22px] font-medium tracking-tight text-ink">{money(property.price, property.listingType)}</p>
        <h2 className="mt-1.5 line-clamp-1 text-[15px] font-semibold text-ink">{property.title}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted"><MapPin size={13} />{property.locality}, {property.city}</p>
        <div className="mt-auto pt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-4 text-[13px] text-muted">
            {property.bedrooms !== null && <span className="font-medium text-ink">{property.bedrooms} <span className="font-normal text-muted">bed</span></span>}
            {property.bathrooms !== null && <span className="font-medium text-ink flex items-center gap-1"><Bath size={13} strokeWidth={1.5} className="text-muted" />{property.bathrooms} <span className="font-normal text-muted">bath</span></span>}
            <span className="font-medium text-ink">{Number(property.area).toLocaleString("en-IN")} <span className="font-normal text-muted">{property.areaUnit.toLowerCase()}</span></span>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{property.propertyType.replaceAll("_", " ")}</span>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-forest transition-colors group-hover:text-forest-deep">View home <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
          </div>
        </div>
      </div>
    </Link>
  </article>;
}

function FilterFields({ filters }: { filters: PropertySearchInput }) {
  return <div className="grid gap-6">
    <div className="grid gap-3">
      <label className="text-[13px] font-semibold tracking-wide text-ink">City</label>
      <input name="city" defaultValue={filters.city ?? ""} placeholder="e.g. Mumbai" className="h-10 w-full rounded-[3px] border border-line bg-transparent px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest" />
    </div>
    <div className="grid gap-3">
      <label className="text-[13px] font-semibold tracking-wide text-ink">Locality</label>
      <input name="locality" defaultValue={filters.locality ?? ""} placeholder="e.g. Bandra West" className="h-10 w-full rounded-[3px] border border-line bg-transparent px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest" />
    </div>
    <div className="grid gap-3">
      <label className="text-[13px] font-semibold tracking-wide text-ink">Listing type</label>
      <select name="listingType" defaultValue={filters.listingType ?? ""} className="h-10 w-full rounded-[3px] border border-line bg-transparent px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest">
        <option value="">Any</option><option value="SALE">For sale</option><option value="RENT">For rent</option>
      </select>
    </div>
    <div className="grid gap-3">
      <label className="text-[13px] font-semibold tracking-wide text-ink">Property type</label>
      <select name="propertyType" defaultValue={filters.propertyType ?? ""} className="h-10 w-full rounded-[3px] border border-line bg-transparent px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest">
        <option value="">Any</option>{propertyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
    <div className="grid gap-3">
      <label className="text-[13px] font-semibold tracking-wide text-ink">Bedrooms</label>
      <select name="bedrooms" defaultValue={filters.bedrooms ?? ""} className="h-10 w-full rounded-[3px] border border-line bg-transparent px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest">
        <option value="">Any</option><option value="0">Studio</option>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}+</option>)}
      </select>
    </div>
    <div className="grid gap-3">
      <label className="text-[13px] font-semibold tracking-wide text-ink">Budget</label>
      <div className="grid grid-cols-2 gap-2">
        <input name="minPrice" type="number" min="0" defaultValue={filters.minPrice ?? ""} placeholder="Min" className="h-10 w-full rounded-[3px] border border-line bg-transparent px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest" />
        <input name="maxPrice" type="number" min="0" defaultValue={filters.maxPrice ?? ""} placeholder="Max" className="h-10 w-full rounded-[3px] border border-line bg-transparent px-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest" />
      </div>
    </div>
  </div>;
}

function FilterForm({ filters, queryKey, mobile = false, onApplied }: { filters: PropertySearchInput; queryKey: string; mobile?: boolean; onApplied?: () => void }) {
  return <form key={queryKey} action="/properties" method="get" onSubmit={() => onApplied?.()} className={mobile ? "grid gap-4" : "grid gap-5"}>
    {filters.q && <input type="hidden" name="q" value={filters.q} />}
    <input type="hidden" name="page" value="1" />
    <input type="hidden" name="limit" value={filters.limit} />
    <input type="hidden" name="sort" value={filters.sort} />
    <FilterFields filters={filters} />
    <button className={`font-semibold ${mobile ? "mt-2 h-12 w-full bg-forest text-white" : "h-11 bg-forest text-sm text-white"}`}>{mobile ? "Show homes" : "Apply filters"}</button>
    <Link href="/properties" className="text-xs font-semibold text-forest underline underline-offset-4">Clear all filters</Link>
  </form>;
}

export function Discovery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryKey = searchParams.toString();
  const parsed = useMemo(() => parseDiscoveryQuery(queryKey), [queryKey]);
  const filters = parsed.success ? parsed.data : baseFilters;
  const [result, setResult] = useState<ApiListSuccess<PublicPropertyRecord> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!parsed.success) {
        setResult(null);
        setError(parsed.error.issues[0]?.message ?? "Check your search filters and try again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      setResult(null);
      void searchProperties(parsed.data).then((response) => {
        if (active) setResult(response);
      }).catch((cause: unknown) => {
        if (active) setError(cause instanceof ApiError ? cause.message : "We couldn’t load homes right now.");
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [parsed, retryCount]);

  function setSort(sort: (typeof sortOptions)[number]["value"]) {
    const next = updateDiscoveryQuery(queryKey, { sort, page: 1 });
    router.push(`${pathname}?${next}`, { scroll: false });
  }

  function setPage(page: number) {
    router.push(`${pathname}?${updateDiscoveryQuery(queryKey, { page })}`, { scroll: false });
  }

  const preservedFilters = Object.entries(filters).filter(([key, value]) => key !== "q" && key !== "city" && key !== "page" && key !== "limit" && value !== undefined && value !== "");
  const viewState = getDiscoveryState({ loading, error, result });

  return <>
    <div className="border-b border-line bg-paper"><div className="container py-10 sm:py-14"><p className="eyebrow">Thoughtfully found</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-ink sm:text-4xl">Find a place to call home.</h1><p className="mt-3 text-sm text-muted">Explore published homes and properties across India.</p>
      <form action="/properties" method="get" key={`search-${queryKey}`} className="mt-7 flex max-w-4xl flex-col gap-2 border border-line bg-white p-2 shadow-[0_12px_35px_rgba(5,36,29,.08)] sm:flex-row"><input name="q" defaultValue={filters.q ?? ""} placeholder="Keyword, locality or landmark" aria-label="Search properties" className="h-11 min-w-0 flex-1 px-3 text-sm text-ink outline-none" /><input name="city" defaultValue={filters.city ?? ""} placeholder="City" aria-label="City" className="h-11 min-w-0 border-t border-line px-3 text-sm text-ink outline-none sm:w-44 sm:border-l sm:border-t-0" />{preservedFilters.map(([key, value]) => <input key={key} type="hidden" name={key} value={String(value)} />)}<input type="hidden" name="page" value="1" /><input type="hidden" name="limit" value={filters.limit} /><button className="h-11 shrink-0 bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-deep">Search homes</button></form>
    </div></div>
    <div className="container py-8 sm:py-12">
      <div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm text-muted" aria-live="polite">{viewState === "loading" ? "Finding homes…" : `${result?.pagination.total ?? 0} homes to explore`}</p><div className="flex items-center gap-2"><button onClick={() => setMobileFilters(true)} className="flex h-10 items-center gap-2 border border-line px-3 text-sm lg:hidden"><SlidersHorizontal size={16} />Filters</button><label className="flex h-10 items-center gap-2 border border-line px-3 text-sm text-muted">Sort<select value={filters.sort ?? "newest"} onChange={(event) => { const option = sortOptions.find(({ value }) => value === event.target.value); if (option) setSort(option.value); }} className="bg-white text-ink">{sortOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label></div></div>
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden h-fit border border-line bg-white p-5 lg:block"><h2 className="mb-5 text-base font-semibold">Refine your search</h2><FilterForm filters={filters} queryKey={queryKey} /></aside>
        <section aria-live="polite">
          {viewState === "error" ? <div className="border border-red-200 bg-red-50 p-8 text-center"><h2 className="font-semibold text-red-900">Something went wrong.</h2><p className="mt-2 text-sm text-red-800">These homes couldn't be loaded right now.</p>{parsed.success && <button onClick={() => setRetryCount((count) => count + 1)} className="mt-4 font-semibold text-forest underline">Try again</button>}</div>
            : viewState === "loading" ? <div role="status" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="flex flex-col overflow-hidden rounded-[3px] border border-line bg-white"><div className="aspect-[4/3] animate-pulse bg-paper" /><div className="flex flex-1 flex-col p-5"><div className="h-7 w-1/3 animate-pulse rounded-sm bg-paper" /><div className="mt-2.5 h-5 w-3/4 animate-pulse rounded-sm bg-paper" /><div className="mt-2 h-4 w-1/2 animate-pulse rounded-sm bg-paper" /><div className="mt-auto pt-6"><div className="flex gap-3 border-t border-line pt-4"><div className="h-4 w-16 animate-pulse rounded-sm bg-paper" /><div className="h-4 w-16 animate-pulse rounded-sm bg-paper" /></div></div></div></div>)}</div>
              : viewState === "results" ? <><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{result?.data.map((property) => <PropertyCard key={property.id} property={property} />)}</div><div className="mt-9 flex items-center justify-between border-t border-line pt-5"><span className="text-sm text-muted">Page {result?.pagination.page} of {Math.max(1, result?.pagination.totalPages ?? 1)}</span><div className="flex gap-2"><button disabled={filters.page <= 1} onClick={() => setPage(Math.max(1, filters.page - 1))} className="h-10 border border-line px-4 text-sm disabled:opacity-40">Previous</button><button disabled={result?.pagination.hasNextPage === false || filters.page >= (result?.pagination.totalPages ?? 1)} onClick={() => setPage(filters.page + 1)} className="h-10 border border-line px-4 text-sm disabled:opacity-40">Next</button></div></div></>
                : <div className="flex flex-col items-center justify-center border border-line bg-white px-6 py-20 text-center">
                  <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-forest-soft text-forest">
                    <Search size={28} strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-ink">Nothing quite matched.</h2>
                  <div className="mt-4 max-w-md text-sm leading-6 text-muted">
                    <p>Try widening your search or removing one of the filters.</p>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link href="/properties" className="flex h-11 items-center justify-center rounded-[3px] bg-forest px-6 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">Clear search</Link>
                    <Link href="/properties" className="flex h-11 items-center justify-center rounded-[3px] border border-line bg-white px-6 text-sm font-semibold text-ink transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">Browse all homes</Link>
                  </div>
                </div>}
        </section>
      </div>
    </div>
    {mobileFilters && <div className="fixed inset-0 z-[70] bg-black/40 lg:hidden" onClick={() => setMobileFilters(false)}><section role="dialog" aria-modal="true" aria-label="Search filters" onClick={(event) => event.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-auto bg-white p-6"><div className="mb-5 flex justify-between"><h2 className="text-lg font-semibold">Refine your search</h2><button aria-label="Close filters" onClick={() => setMobileFilters(false)}>×</button></div><FilterForm filters={filters} queryKey={`mobile-${queryKey}`} mobile onApplied={() => setMobileFilters(false)} /></section></div>}
  </>;
}
