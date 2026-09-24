"use client";

import { useAuth } from "@/components/auth/auth-provider";

export default function ProfilePage() {
  const { user } = useAuth();
  const items = [["Name", user?.profile?.name], ["Email", user?.email], ["Phone", user?.phone], ["Role", user?.role], ["City", user?.profile?.city], ["State", user?.profile?.state]] as const;
  return <><p className="eyebrow">Account details</p><h1 className="mt-2 text-3xl font-semibold">My profile</h1><p className="mt-3 text-sm text-muted">These details come from your authenticated session.</p><dl className="mt-7 divide-y divide-line border-y border-line bg-white">{items.map(([label, value])=><div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[150px_1fr] sm:px-7"><dt className="text-sm text-muted">{label}</dt><dd className="break-words text-sm font-medium text-ink">{value || "Not provided"}</dd></div>)}</dl><p className="mt-5 border-l-2 border-gold bg-white px-4 py-3 text-sm leading-6 text-muted">Profile read and update endpoints are not available yet. These details are view-only.</p></>;
}
