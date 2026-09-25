import Image from "next/image";
import Link from "next/link";
import type { PropertyRecord } from "@ghardekho/types";

const statusLabel:Record<PropertyRecord["status"],string>={DRAFT:"Draft",PENDING_REVIEW:"In review",PUBLISHED:"Published",REJECTED:"Needs changes",SOLD:"Sold",RENTED:"Rented",ARCHIVED:"Archived"};
const statusStyle:Record<PropertyRecord["status"],string>={DRAFT:"bg-paper text-muted",PENDING_REVIEW:"bg-[#fbf3e4] text-[#76571c]",PUBLISHED:"bg-forest-soft text-forest",REJECTED:"bg-red-50 text-red-700",SOLD:"bg-paper text-muted",RENTED:"bg-paper text-muted",ARCHIVED:"bg-paper text-muted"};

export function OwnerPropertyCard({property,onArchive,archiving=false,compact=false}:{property:PropertyRecord;onArchive?:()=>void;archiving?:boolean;compact?:boolean}) {
  const photo=property.media?.find((item)=>item.isPrimary)?.url??property.media?.find((item)=>item.type==="IMAGE")?.url;
  const price=Number(property.price);const formatted=price>=10_000_000?`₹${(price/10_000_000).toFixed(2)} Cr`:price>=100_000?`₹${(price/100_000).toFixed(1)} L`:`₹${price.toLocaleString("en-IN")}`;
  return <article className={`grid gap-4 border-b border-line py-5 sm:grid-cols-[150px_1fr] sm:items-center ${compact?"first:pt-0 last:border-0 last:pb-0":""}`}>
    <div className="relative aspect-[1.55] bg-paper sm:aspect-[1.35]">{photo?<Image src={photo} alt={property.title} fill unoptimized sizes="150px" className="object-cover"/>:<div className="grid h-full place-items-center text-xs text-muted">No photo</div>}</div>
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyle[property.status]}`}>{statusLabel[property.status]}</span><span className="text-xs text-muted">{property.listingType==="SALE"?"For sale":"For rent"}</span></div><h2 className="mt-2 line-clamp-1 font-semibold text-ink">{property.title}</h2><p className="mt-1 text-sm text-muted">{property.locality}, {property.city} · {property.propertyType.replaceAll("_"," ")}</p><p className="mt-2 text-sm font-semibold text-ink">{formatted}{property.listingType==="RENT"&&<span className="font-normal text-muted"> / month</span>}</p><p className="mt-1 text-xs text-muted">Updated {new Date(property.updatedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p><div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold"><Link href={`/dashboard/properties/${property.id}/edit`} className="text-forest underline underline-offset-4">Edit</Link><Link href={`/properties/${encodeURIComponent(property.slug||property.id)}`} className="text-forest underline underline-offset-4">View listing</Link>{onArchive&&property.status!=="ARCHIVED"&&<button onClick={onArchive} disabled={archiving} className="text-muted underline underline-offset-4 disabled:opacity-50">{archiving?"Archiving…":"Archive"}</button>}</div></div>
  </article>;
}
