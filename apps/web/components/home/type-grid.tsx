import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { propertyTypes } from "@/lib/homepage-content";

export function TypeGrid() {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    {propertyTypes.map((type) => <Link href="/properties" key={type.name} className="group border border-line bg-white">
      <div className="relative aspect-[1.28] overflow-hidden bg-paper">
        <Image src={`https://images.unsplash.com/${type.image}?auto=format&fit=crop&w=900&q=80`} alt={type.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      </div>
      <div className="flex items-start justify-between gap-2 p-3.5 sm:p-4">
        <div><h3 className="text-sm font-semibold text-ink sm:text-base">{type.name}</h3><p className="mt-1 text-xs leading-5 text-muted">{type.count}</p></div>
        <ArrowUpRight size={17} className="mt-0.5 shrink-0 text-forest" aria-hidden="true" />
      </div>
    </Link>)}
  </div>;
}
