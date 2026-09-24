"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";

const sections = [
  { label: "Overview", href: "/dashboard" }, { label: "My properties", href: "/dashboard/properties" },
  { label: "Post property", href: "/dashboard/properties/new" }, { label: "Inquiries", href: "/dashboard/inquiries" },
  { label: "Visits", href: "/dashboard/visits" }, { label: "My profile", href: "/dashboard/profile" },
];

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth(); const router = useRouter(); const pathname = usePathname();
  useEffect(() => { if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`); }, [loading, user, router, pathname]);
  if (loading || !user) return <div className="container grid min-h-[55vh] place-items-center"><p role="status" className="text-sm text-muted">{loading ? "Checking your session…" : "Taking you to login…"}</p></div>;
  return <div className="min-h-[65vh] bg-paper"><div className="container py-8 sm:py-12"><div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12"><aside className="h-fit border-b border-line pb-4 lg:sticky lg:top-24 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"><p className="eyebrow">Your account</p><nav aria-label="Dashboard" className="mt-3 flex gap-2 overflow-x-auto lg:grid">{sections.map((item) => { const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} className={`whitespace-nowrap px-3 py-2.5 text-sm ${active ? "bg-forest text-white" : "text-ink hover:bg-white"}`}>{item.label}</Link>; })}</nav></aside><div className="min-w-0">{children}</div></div></div></div>;
}
