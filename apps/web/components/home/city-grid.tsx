import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { locations } from "@/lib/homepage-content";

export function CityGrid() {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
    {locations.map((city, index) => <Link href={`/cities/${city.name.toLowerCase().replaceAll(" ", "-")}`} key={city.name} className={`group relative isolate flex min-h-[190px] flex-col justify-end overflow-hidden bg-forest-deep p-4 text-white sm:min-h-[220px] ${index === 0 ? "sm:col-span-2 lg:col-span-2" : ""}`}>
      <Image src={`https://images.unsplash.com/${city.image}?auto=format&fit=crop&w=800&q=80`} alt={`${city.name} city`} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="-z-20 object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      <span className="image-shade absolute inset-0 -z-10" />
      <span className="absolute right-3 top-3 grid size-8 place-items-center border border-white/35 text-white transition-colors group-hover:bg-white group-hover:text-forest"><ArrowUpRight size={15} /></span>
      <span className="text-lg font-semibold tracking-tight">{city.name}</span>
      <span className="mt-1 text-xs text-white/75">{city.note}</span>
    </Link>)}
  </div>;
}
