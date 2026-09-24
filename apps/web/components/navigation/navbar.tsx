"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";

const publicLinks = [
  { label: "Buy", href: "/properties?listingType=SALE" }, { label: "Rent", href: "/properties?listingType=RENT" },
  { label: "New projects", href: "/properties?category=projects" }, { label: "Locations", href: "/#locations" },
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
  async function handleSignOut() {
    try { await signOut(); router.push("/"); router.refresh(); }
    catch { window.alert("We couldn’t log you out. Please try again."); }
  }
  return <header className="sticky top-0 z-50 border-b border-line/80 bg-white/95 backdrop-blur-sm">
    <div className="container flex h-[76px] items-center justify-between gap-5">
      <Link href="/" aria-label="GharDekho home" className="shrink-0"><Image src="/brand/ghardekhologo.png" alt="GharDekho — Find a place to call your home" width={2172} height={724} priority className="h-auto w-[170px] sm:w-[190px]"/></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-2 lg:flex 2xl:gap-4">
        {(user ? accountLinks : publicLinks).map((link) => <Link key={link.href} href={link.href} className="text-[11px] font-medium text-[#39443f] transition-colors hover:text-forest 2xl:text-xs">{link.label}</Link>)}
      </nav>
      <div className="hidden items-center gap-3 lg:flex">
        <Link href="/properties" aria-label="Search properties" className="grid size-9 place-items-center text-ink hover:text-forest"><Search size={18}/></Link>
        {user ? <><span className="max-w-24 truncate text-xs text-muted">{user.profile?.name ?? user.email}</span><button onClick={() => void handleSignOut()} className="text-xs font-semibold text-ink hover:text-forest">Log out</button></> : <><Link href="/login" className="text-xs font-semibold text-ink hover:text-forest">Log in</Link><Link href="/register" className="text-xs font-semibold text-ink hover:text-forest">Register</Link></>}
        <Button href="/dashboard/properties/new" className="min-h-10 px-3 text-xs">Post Property <span aria-hidden="true">↗</span></Button>
      </div>
      <div className="flex items-center gap-2 lg:hidden">
        <Button href="/dashboard/properties/new" className="min-h-9 px-3 text-xs">Post Property</Button>
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} className="grid size-10 place-items-center text-ink">{open ? <X size={21}/> : <Menu size={21}/>}</button>
      </div>
    </div>
    {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-line bg-white px-4 py-3 lg:hidden">
      {(user ? accountLinks : publicLinks).map((link) => <Link key={link.href} onClick={() => setOpen(false)} href={link.href} className="block border-b border-line/70 py-3.5 text-sm font-medium text-ink">{link.label}</Link>)}
      {!user && <><Link onClick={() => setOpen(false)} href="/login" className="block border-b border-line/70 py-3.5 text-sm font-medium text-ink">Log in</Link><Link onClick={() => setOpen(false)} href="/register" className="block py-3.5 text-sm font-medium text-ink">Register</Link></>}
      {user && <button onClick={() => { setOpen(false); void handleSignOut(); }} className="block w-full py-3.5 text-left text-sm font-medium text-ink">Log out</button>}
    </nav>}
  </header>;
}
