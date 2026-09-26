"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bath, MapPin, SlidersHorizontal } from "lucide-react";
import { propertySearchSchema } from "@ghardekho/validation";
import type { PropertySearchInput, PropertySearchRequest } from "@ghardekho/validation";
import type { ApiListSuccess, PublicPropertyRecord } from "@ghardekho/types";
import { ApiError } from "@/lib/api/client";
import { searchProperties } from "@/lib/api/properties";

const propertyTypes = [["APARTMENT", "Apartment"], ["HOUSE", "House"], ["VILLA", "Villa"], ["PLOT", "Plot"], ["COMMERCIAL", "Commercial"], ["OFFICE", "Office"], ["SHOP", "Shop"], ["WAREHOUSE", "Warehouse"], ["OTHER", "Other"]];
const baseFilters: PropertySearchInput = { page: 1, limit: 12, sort: "newest" };

const money = (price: string, type: string) => {
  const amount = Number(price);
  const value = amount >= 10_000_000 ? `₹${(amount / 10_000_000).toFixed(amount % 10_000_000 ? 2 : 0)} Cr` : amount >= 100_000 ? `₹${(amount / 100_000).toFixed(amount % 100_000 ? 1 : 0)} L` : `₹${amount.toLocaleString("en-IN")}`;
  return type === "RENT" ? `${value} / month` : value;
};

function PropertyCard({ property }: { property: PublicPropertyRecord }) {
  const photo = property.media?.find((item) => item.isPrimary)?.url ?? property.media?.find((item) => item.type === "IMAGE")?.url;
  const altText = property.media?.find((item) => item.url === photo)?.altText || property.title;
  return <article className="group overflow-hidden border border-line bg-white transition-shadow hover:shadow-[0_14px_40px_rgba(5,36,29,.11)]">
    <Link href={`/properties/${encodeURIComponent(property.slug)}`} className="block">
      <div className="relative aspect-[1.48] bg-forest-soft">
        {photo ? <Image src={photo} alt={altText} fill unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" /> : <div className="grid h-full place-items-center text-sm text-muted">Photos coming soon</div>}
        <span className="absolute left-4 top-4 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-forest">For {property.listingType === "RENT" ? "rent" : "sale"}</span>
      </div>
      <div className="p-5">
        <p className="text-xl font-semibold tracking-tight text-ink">{money(property.price, property.listingType)}</p>
        <h2 className="mt-2 line-clamp-1 text-[15px] font-semibold text-ink">{property.title}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} />{property.locality}, {property.city}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-muted">
          {property.bedrooms !== null && <span>{property.bedrooms} bed</span>}
          {property.bathrooms !== null && <span className="flex items-center gap-1"><Bath size={13} />{property.bathrooms} bath</span>}
          <span>{Number(property.area).toLocaleString("en-IN")} {property.areaUnit.toLowerCase()}</span>
          <span className="ml-auto">{property.propertyType.replaceAll("_", " ")}</span>
        </div>
      </div>
    </Link>
  </article>;
}

function FilterFields({ filters }: { filters: PropertySearchInput }) {
  return <>
    <label className="grid gap-2 text-xs font-semibold text-muted">City<input name="city" defaultValue={filters.city ?? ""} placeholder="Any city" className="h-11 border border-line px-3 text-sm font-normal text-ink" /></label>
    <label className="grid gap-2 text-xs font-semibold text-muted">Locality<input name="locality" defaultValue={filters.locality ?? ""} placeholder="Neighbourhood" className="h-11 border border-line px-3 text-sm font-normal text-ink" /></label>
    <label className="grid gap-2 text-xs font-semibold text-muted">Listing<select name="listingType" defaultValue={filters.listingType ?? ""} className="h-11 border border-line bg-white px-3 text-sm font-normal text-ink"><option value="">Buy or rent</option><option value="SALE">For sale</option><option value="RENT">For rent</option></select></label>
    <label className="grid gap-2 text-xs font-semibold text-muted">Property type<select name="propertyType" defaultValue={filters.propertyType ?? ""} className="h-11 border border-line bg-white px-3 text-sm font-normal text-ink"><option value="">All types</option>{propertyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-2"><label className="grid gap-2 text-xs font-semibold text-muted">Min price<input name="minPrice" type="number" min="0" defaultValue={filters.minPrice ?? ""} className="h-11 min-w-0 border border-line px-3 text-sm font-normal text-ink" /></label><label className="grid gap-2 text-xs font-semibold text-muted">Max price<input name="maxPrice" type="number" min="0" defaultValue={filters.maxPrice ?? ""} className="h-11 min-w-0 border border-line px-3 text-sm font-normal text-ink" /></label></div>
    <div className="grid grid-cols-2 gap-2"><label className="grid gap-2 text-xs font-semibold text-muted">Min bedrooms<input name="minBedrooms" type="number" min="0" max="30" defaultValue={filters.minBedrooms ?? ""} className="h-11 min-w-0 border border-line px-3 text-sm font-normal text-ink" /></label><label className="grid gap-2 text-xs font-semibold text-muted">Max bedrooms<input name="maxBedrooms" type="number" min="0" max="30" defaultValue={filters.maxBedrooms ?? ""} className="h-11 min-w-0 border border-line px-3 text-sm font-normal text-ink" /></label></div>
    <div className="grid grid-cols-2 gap-2"><label className="grid gap-2 text-xs font-semibold text-muted">Min area<input name="minArea" type="number" min="0.01" step="any" defaultValue={filters.minArea ?? ""} className="h-11 min-w-0 border border-line px-3 text-sm font-normal text-ink" /></label><label className="grid gap-2 text-xs font-semibold text-muted">Max area<input name="maxArea" type="number" min="0.01" step="any" defaultValue={filters.maxArea ?? ""} className="h-11 min-w-0 border border-line px-3 text-sm font-normal text-ink" /></label></div>
    <label className="grid gap-2 text-xs font-semibold text-muted">Furnishing<select name="furnishing" defaultValue={filters.furnishing ?? ""} className="h-11 border border-line bg-white px-3 text-sm font-normal text-ink"><option value="">Any</option><option value="UNFURNISHED">Unfurnished</option><option value="SEMI_FURNISHED">Semi-furnished</option><option value="FURNISHED">Furnished</option></select></label>
  </>;
}

function FilterForm({ filters, queryKey, mobile = false }: { filters: PropertySearchInput; queryKey: string; mobile?: boolean }) {
  return <form key={queryKey} action="/properties" method="get" className={mobile ? "grid gap-4" : "grid gap-5"}>
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
  const parsed = useMemo(() => propertySearchSchema.safeParse(Object.fromEntries(new URLSearchParams(queryKey))), [queryKey]);
  const filters = parsed.success ? parsed.data : baseFilters;
  const [result, setResult] = useState<ApiListSuccess<PublicPropertyRecord> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileFilters, setMobileFilters] = useState(false);

  const load = useCallback(async (next: PropertySearchRequest) => {
    setLoading(true);
    setError("");
    setResult(null);
    try { setResult(await searchProperties(next)); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "We couldn’t load homes right now."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!parsed.success) {
        setResult(null);
        setError(parsed.error.issues[0]?.message ?? "Check your search filters and try again.");
        setLoading(false);
        return;
      }
      void load(parsed.data);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, parsed]);

  function setSort(sort: string) {
    const next = new URLSearchParams(queryKey);
    next.set("sort", sort);
    next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function setPage(page: number) {
    const next = new URLSearchParams(queryKey);
    next.set("page", String(page));
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const preservedFilters = Object.entries(filters).filter(([key, value]) => key !== "q" && key !== "page" && key !== "limit" && value !== undefined && value !== "");

  return <>
    <div className="border-b border-line bg-paper"><div className="container py-10 sm:py-14"><p className="eyebrow">Thoughtfully found</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-ink sm:text-4xl">Find a place to call home.</h1><p className="mt-3 text-sm text-muted">Explore published homes and properties across India.</p>
      <form action="/properties" method="get" key={`search-${queryKey}`} className="mt-7 flex max-w-3xl gap-2 border border-line bg-white p-2 shadow-[0_12px_35px_rgba(5,36,29,.08)]"><input name="q" defaultValue={filters.q ?? ""} placeholder="City, locality, address or property" aria-label="Search properties" className="min-w-0 flex-1 px-3 text-sm text-ink outline-none" />{preservedFilters.map(([key, value]) => <input key={key} type="hidden" name={key} value={String(value)} />)}<input type="hidden" name="page" value="1" /><input type="hidden" name="limit" value={filters.limit} /><button className="h-11 shrink-0 bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-deep">Search</button></form>
    </div></div>
    <div className="container py-8 sm:py-12">
      <div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm text-muted" aria-live="polite">{loading ? "Finding homes…" : `${result?.pagination.total ?? 0} homes to explore`}</p><div className="flex items-center gap-2"><button onClick={() => setMobileFilters(true)} className="flex h-10 items-center gap-2 border border-line px-3 text-sm lg:hidden"><SlidersHorizontal size={16} />Filters</button><label className="flex h-10 items-center gap-2 border border-line px-3 text-sm text-muted">Sort<select value={filters.sort ?? "newest"} onChange={(event) => setSort(event.target.value)} className="bg-white text-ink"><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="area_asc">Area: smallest first</option><option value="area_desc">Area: largest first</option></select></label></div></div>
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden h-fit border border-line bg-white p-5 lg:block"><h2 className="mb-5 text-base font-semibold">Refine your search</h2><FilterForm filters={filters} queryKey={queryKey} /></aside>
        <section aria-live="polite">
          {error ? <div className="border border-red-200 bg-red-50 p-8 text-center"><h2 className="font-semibold">We couldn’t load these homes</h2><p className="mt-2 text-sm text-muted">{error}</p>{parsed.success && <button onClick={() => void load(filters)} className="mt-4 font-semibold text-forest underline">Try again</button>}</div>
            : loading ? <div role="status" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="animate-pulse"><div className="aspect-[1.48] bg-paper" /><div className="mt-4 h-5 w-1/2 bg-paper" /></div>)}</div>
              : result?.data.length ? <><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{result.data.map((property) => <PropertyCard key={property.id} property={property} />)}</div><div className="mt-9 flex items-center justify-between border-t border-line pt-5"><span className="text-sm text-muted">Page {result.pagination.page} of {Math.max(1, result.pagination.totalPages)}</span><div className="flex gap-2"><button disabled={filters.page <= 1} onClick={() => setPage(Math.max(1, filters.page - 1))} className="h-10 border border-line px-4 text-sm disabled:opacity-40">Previous</button><button disabled={result.pagination.hasNextPage === false || filters.page >= result.pagination.totalPages} onClick={() => setPage(filters.page + 1)} className="h-10 border border-line px-4 text-sm disabled:opacity-40">Next</button></div></div></>
                : <div className="border border-line bg-paper px-6 py-16 text-center"><p className="eyebrow">A fresh start</p><h2 className="mt-3 text-xl font-semibold">No homes match just yet.</h2><p className="mt-2 text-sm text-muted">Try broadening your search or clearing some filters.</p><Link href="/properties" className="mt-5 inline-block font-semibold text-forest underline">Clear search and filters</Link></div>}
        </section>
      </div>
    </div>
    {mobileFilters && <div className="fixed inset-0 z-[70] bg-black/40 lg:hidden" onClick={() => setMobileFilters(false)}><section role="dialog" aria-modal="true" aria-label="Search filters" onClick={(event) => event.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-auto bg-white p-6"><div className="mb-5 flex justify-between"><h2 className="text-lg font-semibold">Refine your search</h2><button aria-label="Close filters" onClick={() => setMobileFilters(false)}>×</button></div><FilterForm filters={filters} queryKey={`mobile-${queryKey}`} mobile /></section></div>}
  </>;
}
