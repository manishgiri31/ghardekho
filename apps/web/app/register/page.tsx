"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAccount } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function RegisterPage() {
  const router=useRouter();const[error,setError]=useState("");const[busy,setBusy]=useState(false);
  async function submit(form: FormData) { setBusy(true);setError("");try { await registerAccount({name:String(form.get("name")),email:String(form.get("email")),password:String(form.get("password")),...(form.get("phone")?{phone:String(form.get("phone"))}:{})});window.dispatchEvent(new Event("ghardekho:session-changed"));router.push("/properties");router.refresh(); }catch(cause){setError(cause instanceof ApiError?cause.message:"Could not create your account.");}finally{setBusy(false);} }
  return <div className="container grid min-h-[70vh] place-items-center py-12"><form action={(form)=>void submit(form)} className="w-full max-w-md border border-line bg-white p-7 sm:p-10"><p className="eyebrow">A new beginning</p><h1 className="mt-2 text-3xl font-semibold">Create your account</h1><p className="mt-2 text-sm text-muted">Save time when you contact property owners.</p><label className="mt-7 grid gap-2 text-sm font-semibold">Full name<input name="name" required maxLength={120} autoComplete="name" className="h-12 border border-line px-3 font-normal"/></label><label className="mt-4 grid gap-2 text-sm font-semibold">Email<input type="email" name="email" required autoComplete="email" className="h-12 border border-line px-3 font-normal"/></label><label className="mt-4 grid gap-2 text-sm font-semibold">Phone (optional)<input type="tel" name="phone" autoComplete="tel" className="h-12 border border-line px-3 font-normal"/></label><label className="mt-4 grid gap-2 text-sm font-semibold">Password<input type="password" name="password" required minLength={12} maxLength={128} autoComplete="new-password" className="h-12 border border-line px-3 font-normal"/><span className="text-xs font-normal text-muted">Use at least 12 characters.</span></label>{error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<button disabled={busy} className="mt-6 h-12 w-full bg-forest font-semibold text-white disabled:opacity-50">{busy?"Creating account…":"Create account"}</button><p className="mt-5 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-forest">Log in</Link></p></form></div>;
}
