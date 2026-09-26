"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

const publicLinks = [
  { label: "Buy", href: "/properties?listingType=SALE", key: "SALE" },
  { label: "Rent", href: "/properties?listingType=RENT", key: "RENT" },
  { label: "New projects", href: "/properties?sort=newest", key: "projects" },
  { label: "Locations", href: "/#locations", key: "locations" },
];

const accountLinks = [
  { label: "Dashboard", href: "/dashboard" }, { label: "My properties", href: "/dashboard/properties" },
  { label: "Inquiries", href: "/dashboard/inquiries" }, { label: "Visits", href: "/dashboard/visits" },
  { label: "Profile", href: "/dashboard/profile" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActive = (key: string) => pathname === "/properties" && (key === "projects"
    ? searchParams.get("sort") === "newest"
    : key === "SALE" || key === "RENT" ? searchParams.get("listingType") === key : false);

  async function handleSignOut() {
    try { await signOut(); setOpen(false); router.push("/"); router.refresh(); }
    catch { window.alert("We couldn’t log you out. Please try again."); }
  }

  return <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm">
    <div className="container flex h-[72px] items-center justify-between gap-4 sm:h-[76px]">
      <Link href="/" aria-label="GharDekho home" className="shrink-0"><Image src="/brand/ghardekhologo.png" alt="GharDekho — Find a place that feels like home" width={2172} height={724} priority className="h-auto w-[130px] sm:w-[160px] lg:w-[178px]" /></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
        {publicLinks.map((link) => <Link key={link.href} href={link.href} aria-current={isActive(link.key) ? "page" : undefined} className={`relative py-2 text-[13px] font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-[2px] after:h-px after:bg-gold after:transition-transform ${isActive(link.key) ? "text-forest after:scale-x-100" : "text-[#39443f] after:scale-x-0 hover:text-forest hover:after:scale-x-100"}`}>{link.label}</Link>)}
      </nav>
      <div className="hidden items-center gap-4 lg:flex">
        <Link href="/properties" aria-label="Search properties" className="grid size-9 place-items-center text-ink transition-colors hover:text-forest"><Search size={18} strokeWidth={1.7} /></Link>
        {user ? <><Link href="/dashboard" className="max-w-28 truncate text-xs font-medium text-muted transition-colors hover:text-forest">{user.profile?.name ?? user.email}</Link><button onClick={() => void handleSignOut()} className="text-xs font-semibold text-muted transition-colors hover:text-forest">Log out</button></> : <><Link href="/login" className="text-xs font-semibold text-ink transition-colors hover:text-forest">Log in</Link><Link href="/register" className="text-xs font-semibold text-ink transition-colors hover:text-forest">Register</Link></>}
        <Link href="/dashboard/properties/new" className="inline-flex h-10 items-center gap-2 rounded-[3px] bg-forest px-4 text-xs font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">Post Property <ArrowUpRight size={14} /></Link>
      </div>
      <div className="flex items-center gap-1 lg:hidden">
        <Link href="/properties" aria-label="Search properties" className="grid size-10 place-items-center text-ink transition-colors hover:text-forest"><Search size={19} strokeWidth={1.7} /></Link>
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} className="grid size-10 place-items-center text-ink focus-visible:outline-2 focus-visible:outline-gold">{open ? <X size={21} /> : <Menu size={21} />}</button>
      </div>
    </div>
    {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-line bg-white px-4 py-3 shadow-sm lg:hidden">
      {publicLinks.map((link) => <Link key={link.href} onClick={() => setOpen(false)} href={link.href} aria-current={isActive(link.key) ? "page" : undefined} className={`block border-b border-line/70 py-3.5 text-sm font-medium ${isActive(link.key) ? "text-forest" : "text-ink"}`}>{link.label}</Link>)}
      {user ? <>
        <p className="border-b border-line/70 py-3.5 text-xs text-muted">Signed in as <span className="font-semibold text-ink">{user.profile?.name ?? user.email}</span></p>
        {accountLinks.map((link) => <Link key={link.href} onClick={() => setOpen(false)} href={link.href} className="block border-b border-line/70 py-3 text-sm font-medium text-ink">{link.label}</Link>)}
        <button onClick={() => void handleSignOut()} className="block w-full py-3.5 text-left text-sm font-semibold text-forest">Log out</button>
      </> : <div className="grid grid-cols-2 gap-3 py-4"><Link onClick={() => setOpen(false)} href="/login" className="border border-line py-3 text-center text-sm font-semibold">Log in</Link><Link onClick={() => setOpen(false)} href="/register" className="bg-forest py-3 text-center text-sm font-semibold text-white">Register</Link></div>}
      <Link onClick={() => setOpen(false)} href="/dashboard/properties/new" className="mt-2 flex h-11 items-center justify-center gap-2 rounded-[3px] bg-forest text-sm font-semibold text-white">Post Property <ArrowUpRight size={15} /></Link>
    </nav>}
  </header>;
}
