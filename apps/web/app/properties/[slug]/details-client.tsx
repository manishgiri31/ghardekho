"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BedDouble, Bath, MapPin, Ruler, ShieldCheck } from "lucide-react";
import type { PropertyDetailsRecord } from "@ghardekho/types";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiError } from "@/lib/api/client";
import { getProperty } from "@/lib/api/properties";
import { createInquiry, requestVisit } from "@/lib/api/interactions";

const statusLabel: Record<NonNullable<PropertyDetailsRecord["status"]>, string> = {
  DRAFT: "Draft", PENDING_REVIEW: "Under review", PUBLISHED: "Published", REJECTED: "Needs changes",
  SOLD: "Sold", RENTED: "Rented", ARCHIVED: "Archived",
};

export default function DetailsClient({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyDetailsRecord | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getProperty(slug)
      .then((response) => { if (active) setProperty(response.data); })
      .catch((cause) => { if (active) setError(cause instanceof ApiError && cause.status === 404 ? "This property is no longer available." : cause.message); });
    return () => { active = false; };
  }, [slug]);

  if (error) return <div className="container py-24 text-center"><h1 className="text-2xl font-semibold">Property unavailable</h1><p className="mt-3 text-muted">{error}</p><Link href="/properties" className="mt-6 inline-block font-semibold text-forest underline">Back to homes</Link></div>;
  if (!property) return <div role="status" className="container py-24 text-muted">Loading property details…</div>;

  const listing = property;
  const isPublished = listing.status === undefined || listing.status === "PUBLISHED";
  const isOwner = user?.id === listing.ownerId;
  const isOwnerUnpublished = isOwner && !isPublished;
  const photos = listing.media?.filter((media) => media.type === "IMAGE") ?? [];
  const photo = photos.find((media) => media.isPrimary) ?? photos[0];

  async function submitInquiry(form: FormData) {
    setBusy(true); setNotice("");
    try {
      await createInquiry(listing.id, { message: String(form.get("message")), ...(form.get("phone") ? { phone: String(form.get("phone")) } : {}) });
      setNotice("Your inquiry has been sent to the property owner.");
    } catch (cause) {
      setNotice(cause instanceof ApiError && cause.status === 401 ? "Please log in to contact the owner." : cause instanceof Error ? cause.message : "Could not send inquiry.");
    } finally { setBusy(false); }
  }

  async function submitVisit(form: FormData) {
    setBusy(true); setNotice("");
    try {
      const requestedAt = new Date(String(form.get("requestedAt"))).toISOString();
      await requestVisit(listing.id, { requestedAt, ...(form.get("visitMessage") ? { message: String(form.get("visitMessage")) } : {}) });
      setNotice("Your visit request has been sent.");
    } catch (cause) {
      setNotice(cause instanceof ApiError && cause.status === 401 ? "Please log in to request a visit." : cause instanceof Error ? cause.message : "Could not request a visit.");
    } finally { setBusy(false); }
  }

  const amount = Number(property.price);
  const price = amount >= 10_000_000 ? `₹${(amount / 10_000_000).toFixed(2)} Cr` : amount >= 100_000 ? `₹${(amount / 100_000).toFixed(1)} L` : `₹${amount.toLocaleString("en-IN")}`;
  const backHref = isOwnerUnpublished ? "/dashboard/properties" : "/properties";
  const backLabel = isOwnerUnpublished ? "Back to my properties" : "Back to homes";

  return <div className="container py-8 sm:py-12">
    <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-forest"><ArrowLeft size={16} />{backLabel}</Link>
    {!isPublished && <section className="mb-7 border-l-2 border-gold bg-white p-5 sm:p-6" aria-label="Private listing status">
      <p className="eyebrow">{isOwner ? "Owner-only listing" : "Private listing"}</p>
      <h1 className="mt-2 text-lg font-semibold">This listing is not public</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Current status: <strong className="font-semibold text-ink">{property.status ? statusLabel[property.status] : "Not published"}</strong>. This listing is hidden from public search.</p>
      {isOwner && <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">{property.status !== "ARCHIVED" && <Link href={`/dashboard/properties/${property.id}/edit`} className="text-forest underline underline-offset-4">Edit listing</Link>}<Link href="/dashboard/properties" className="text-forest underline underline-offset-4">Manage my properties{property.status === "ARCHIVED" ? " and restore listing" : ""}</Link></div>}
    </section>}
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <main>
        <div className="relative aspect-[1.8] overflow-hidden bg-paper">{photo ? <Image src={photo.url} alt={photo.altText || property.title} fill unoptimized priority sizes="(max-width: 1024px) 100vw, 65vw" className="object-cover" /> : <div className="grid h-full place-items-center text-muted">Photos coming soon</div>}<span className="absolute left-4 top-4 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-forest">For {property.listingType === "RENT" ? "rent" : "sale"}</span></div>
        {photos.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3">{photos.slice(0, 4).map((media) => <div key={media.id} className="relative aspect-[1.5] bg-paper"><Image src={media.url} alt={media.altText || property.title} fill unoptimized sizes="25vw" className="object-cover" /></div>)}</div>}
        <p className="eyebrow mt-8">{property.propertyType.replaceAll("_", " ")}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{property.title}</h2>
        <p className="mt-3 flex items-center gap-2 text-muted"><MapPin size={16} />{property.address}, {property.locality}, {property.city}, {property.state} {property.pincode}</p>
        <div className="mt-7 flex flex-wrap gap-6 border-y border-line py-5 text-sm">{property.bedrooms !== null && <span className="flex items-center gap-2"><BedDouble size={17} />{property.bedrooms} bedrooms</span>}{property.bathrooms !== null && <span className="flex items-center gap-2"><Bath size={17} />{property.bathrooms} bathrooms</span>}<span className="flex items-center gap-2"><Ruler size={17} />{Number(property.area).toLocaleString("en-IN")} {property.areaUnit.toLowerCase()}</span>{property.owner?.profile?.name && <span className="flex items-center gap-2"><ShieldCheck size={17} />Listed by {property.owner.profile.name}</span>}</div>
        <h2 className="mt-8 text-xl font-semibold">About this property</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{property.description}</p>
        {property.amenities?.length ? <><h2 className="mt-8 text-xl font-semibold">Amenities</h2><ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{property.amenities.map(({ amenity }) => <li key={amenity.id} className="border border-line px-4 py-3 text-sm">{amenity.name}</li>)}</ul></> : null}
      </main>
      <aside className="h-fit border border-line bg-white p-6 lg:sticky lg:top-24">
        <p className="text-2xl font-semibold">{price}{property.listingType === "RENT" && <span className="text-sm font-normal text-muted"> / month</span>}</p>
        <p className="mt-1 text-sm text-muted">{property.locality}, {property.city}</p>
        <p className="mt-5 text-xs text-muted">Owner: {property.owner?.profile?.name || "Property owner"}</p>
        {isPublished ? <>
          <form action={(form) => void submitInquiry(form)} className="mt-5 grid gap-3"><h2 className="text-sm font-semibold">Contact the owner</h2><textarea name="message" required minLength={10} maxLength={3000} placeholder="Tell the owner what you’d like to know" className="min-h-24 border border-line p-3 text-sm" /><input name="phone" placeholder="Phone (optional)" className="h-11 border border-line px-3 text-sm" /><button disabled={busy} className="h-12 bg-forest text-sm font-semibold text-white disabled:opacity-50">Send inquiry</button></form>
          <form action={(form) => void submitVisit(form)} className="mt-6 grid gap-3 border-t border-line pt-5"><h2 className="text-sm font-semibold">Request a visit</h2><input name="requestedAt" type="datetime-local" required className="h-11 border border-line px-3 text-sm" /><textarea name="visitMessage" maxLength={1000} placeholder="A note for the owner (optional)" className="min-h-16 border border-line p-3 text-sm" /><button disabled={busy} className="h-12 border border-forest text-sm font-semibold text-forest disabled:opacity-50">Request a visit</button></form>
          {notice && <p role="status" className="mt-4 text-sm text-forest">{notice}</p>}
          <p className="mt-4 text-xs leading-5 text-muted">Your request is shared securely with the property owner.</p>
        </> : <p className="mt-5 border-t border-line pt-5 text-sm leading-6 text-muted">Contact and visit requests are available when a listing is published.</p>}
      </aside>
    </div>
  </div>;
}
