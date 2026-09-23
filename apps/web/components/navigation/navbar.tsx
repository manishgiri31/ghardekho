"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Buy", href: "/buy" },
  { label: "Rent", href: "/rent" },
  { label: "Sell", href: "/sell" },
  { label: "New projects", href: "/properties?category=projects" },
  { label: "Locations", href: "/#locations" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/95 backdrop-blur-sm">
      <div className="container flex h-[76px] items-center justify-between gap-5">
        <Link href="/" aria-label="GharDekho home" className="shrink-0">
          <Image src="/brand/ghardekhologo.png" alt="GharDekho — Find a place to call your home" width={2172} height={724} priority className="h-auto w-[170px] sm:w-[190px]" />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {links.map((link) => <Link key={link.label} href={link.href} className="text-[13px] font-medium text-[#39443f] transition-colors hover:text-forest">{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/properties" aria-label="Search properties" className="grid size-10 place-items-center text-ink transition-colors hover:text-forest"><Search size={18} strokeWidth={1.8} /></Link>
          <Link href="/login" className="text-[13px] font-semibold text-ink hover:text-forest">Log in</Link>
          <Button href="/sell" className="min-h-10 px-4 text-[13px]">Post a property <span aria-hidden="true">↗</span></Button>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Button href="/sell" className="min-h-9 px-3 text-xs">Post property</Button>
          <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} className="grid size-10 place-items-center text-ink focus-visible:outline-2 focus-visible:outline-gold">
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-line bg-white px-4 py-3 lg:hidden">
        {[...links, { label: "Log in", href: "/login" }].map((link) => <Link key={link.label} onClick={() => setOpen(false)} href={link.href} className="block border-b border-line/70 py-3.5 text-sm font-medium text-ink last:border-0">{link.label}</Link>)}
      </nav>}
    </header>
  );
}
