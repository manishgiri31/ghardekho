import Image from "next/image";
import Link from "next/link";

const columns = [
  { title: "Explore", links: [["Buy a home", "/buy"], ["Rent a home", "/rent"], ["New projects", "/properties?category=projects"], ["Popular locations", "/#locations"]] },
  { title: "List with us", links: [["Post a property", "/sell"], ["For agents", "/sell"], ["For builders", "/sell"]] },
  { title: "GharDekho", links: [["About us", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

export function Footer() {
  return (
    <footer className="bg-forest-deep text-white">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12 lg:py-16">
        <div>
          <Link href="/" aria-label="GharDekho home" className="inline-block bg-white px-2 py-1">
            <Image src="/brand/ghardekhologo.png" alt="GharDekho" width={2172} height={724} className="h-auto w-[190px]" />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/65">A more considered way to find a place that feels like home.</p>
        </div>
        {columns.map((column) => <div key={column.title}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[.15em] text-white/45">{column.title}</h2>
          <ul className="space-y-3">{column.links.map(([label, href]) => <li key={label}><Link className="text-sm text-white/80 transition-colors hover:text-gold-light" href={href}>{label}</Link></li>)}</ul>
        </div>)}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GharDekho. Made for finding home.</p>
          <p>India · ghardekho.tech</p>
        </div>
      </div>
    </footer>
  );
}
