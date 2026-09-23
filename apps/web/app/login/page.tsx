"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter(); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(form: FormData) { setBusy(true); setError(""); try { await login({email:String(form.get("email")),password:String(form.get("password"))}); window.dispatchEvent(new Event("ghardekho:session-changed")); router.push("/properties"); router.refresh(); } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not log in."); } finally { setBusy(false); } }
  return <div className="container grid min-h-[70vh] place-items-center py-12"><form action={(form)=>void submit(form)} className="w-full max-w-md border border-line bg-white p-7 sm:p-10"><p className="eyebrow">Welcome back</p><h1 className="mt-2 text-3xl font-semibold">Log in to GharDekho</h1><p className="mt-2 text-sm text-muted">Continue your search for a place that feels like home.</p><label className="mt-7 grid gap-2 text-sm font-semibold">Email<input type="email" name="email" required autoComplete="email" className="h-12 border border-line px-3 font-normal"/></label><label className="mt-4 grid gap-2 text-sm font-semibold">Password<input type="password" name="password" required autoComplete="current-password" className="h-12 border border-line px-3 font-normal"/></label>{error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<button disabled={busy} className="mt-6 h-12 w-full bg-forest font-semibold text-white disabled:opacity-50">{busy?"Logging in…":"Log in"}</button><p className="mt-5 text-center text-sm text-muted">New to GharDekho? <Link href="/register" className="font-semibold text-forest">Create an account</Link></p></form></div>;
}
