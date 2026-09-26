import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { propertyTypes } from "@/lib/homepage-content";
import { FallbackImage } from "@/components/ui/fallback-image";

export function TypeGrid() {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    {propertyTypes.map((type) => <Link href={type.url} key={type.name} className="group flex flex-col overflow-hidden rounded-[3px] border border-line bg-white transition-shadow hover:shadow-[0_12px_30px_rgba(5,36,29,.06)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-paper">
        <FallbackImage src={`https://images.unsplash.com/${type.image}?auto=format&fit=crop&w=900&q=80`} alt={type.name} sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">{type.name}</h3>
          <ArrowUpRight size={17} className="mt-0.5 shrink-0 text-forest transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
        <p className="mt-1.5 text-[13px] leading-5 text-muted">{type.count}</p>
      </div>
    </Link>)}
  </div>;
}
