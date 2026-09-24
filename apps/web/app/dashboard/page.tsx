"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

const actions = [
  { title: "Post a property", copy: "Create a listing for review.", href: "/dashboard/properties/new", label: "Start a listing" },
  { title: "My properties", copy: "Owner listing history is not available yet.", href: "/dashboard/properties", label: "View availability" },
  { title: "Inquiries", copy: "Inquiry history is not available yet.", href: "/dashboard/inquiries", label: "View availability" },
  { title: "Visit requests", copy: "Visit history is not available yet.", href: "/dashboard/visits", label: "View availability" },
  { title: "My profile", copy: "Review your account details.", href: "/dashboard/profile", label: "View profile" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  return <><p className="eyebrow">Your GharDekho</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Welcome, {user?.profile?.name || "home seeker"}.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Your account and next steps, gathered in one place.</p><div className="mt-8 border-y border-line bg-white px-5 py-5 sm:px-7"><p className="text-sm font-semibold">A note about your dashboard</p><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Property, inquiry, and visit history endpoints are not available in the current API, so this overview does not show placeholder counts. You can still create a listing and manage your account session.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{actions.map((action) => <article key={action.href} className="border border-line bg-white p-5 sm:p-6"><h2 className="text-base font-semibold">{action.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{action.copy}</p><Link href={action.href} className="mt-5 inline-flex text-sm font-semibold text-forest underline underline-offset-4">{action.label}</Link></article>)}</div></>;
}
