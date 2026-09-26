import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const columns = [
  { title: "Explore", links: [["Buy a home", "/properties?listingType=SALE"], ["Rent a home", "/properties?listingType=RENT"], ["New projects", "/properties?sort=newest"], ["Popular locations", "/#locations"]] },
  { title: "List with us", links: [["Post a property", "/dashboard/properties/new"], ["For agents", "/register"], ["For builders", "/register"]] },
  { title: "GharDekho", links: [["About", "/#our-approach"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

export function Footer() {
  return <footer className="bg-forest-deep text-white">
    <div className="container grid gap-9 py-12 sm:grid-cols-2 sm:gap-12 sm:py-14 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:gap-16 lg:py-16">
      <div>
        <Link href="/" aria-label="GharDekho home" className="inline-block rounded-[2px] bg-white px-2.5 py-1.5"><Image src="/brand/ghardekhologo.png" alt="GharDekho" width={2172} height={724} className="h-auto w-[164px] sm:w-[178px]" /></Link>
        <p className="mt-5 max-w-xs text-sm leading-6 text-white/65">A more considered way to find a place that feels like home.</p>
      </div>
      {columns.map((column) => <div key={column.title}>
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[.18em] text-gold-light">{column.title}</h2>
        <ul className="space-y-3">{column.links.map(([label, href]) => <li key={label}><Link className="group inline-flex items-center gap-1 text-[13px] text-white/75 transition-colors hover:text-white focus-visible:text-white" href={href}>{label}<ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" /></Link></li>)}</ul>
      </div>)}
    </div>
    <div className="border-t border-white/10">
      <div className="container flex flex-col gap-2 py-5 text-[11px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} GharDekho</p>
        <p>India <span className="px-1 text-gold">·</span> ghardekho.tech</p>
      </div>
    </div>
  </footer>;
}
