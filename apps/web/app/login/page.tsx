"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { loginSchema } from "@ghardekho/validation";
import { useAuth } from "@/components/auth/auth-provider";

export default function LoginPage() {
  const router = useRouter(); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const { refresh } = useAuth();
  async function submit(form: FormData) {
    setBusy(true); setError("");
    const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your email and password."); setBusy(false); return; }
    try { await login(parsed.data); await refresh(); router.push("/dashboard"); router.refresh(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not log in."); }
    finally { setBusy(false); }
  }
  return <div className="flex min-h-[calc(100vh-76px)]">
    <div className="hidden w-1/2 flex-col justify-end bg-forest-deep p-12 text-white lg:flex">
      <div className="max-w-md">
        <h2 className="text-4xl font-medium tracking-tight text-white">Continue your <span className="serif-accent text-gold-light">search.</span></h2>
        <p className="mt-4 text-base leading-7 text-white/75">Sign in to view your saved homes, manage your property listings, and connect with people.</p>
      </div>
    </div>
    <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20 xl:px-32">
      <form action={(form)=>void submit(form)} className="w-full max-w-sm mx-auto">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-[34px]">Log in to GharDekho</h1>
        <p className="mt-3 text-[15px] text-muted">Enter your details below to securely log into your account.</p>
        <div className="mt-10 grid gap-5">
          <label className="grid gap-2 text-[13px] font-semibold tracking-wide text-ink">Email Address
            <input type="email" name="email" required autoComplete="email" className="h-11 rounded-[3px] border border-line bg-transparent px-3 text-sm font-normal transition-colors focus:border-forest focus:ring-1 focus:ring-forest"/>
          </label>
          <label className="grid gap-2 text-[13px] font-semibold tracking-wide text-ink">Password
            <input type="password" name="password" required autoComplete="current-password" className="h-11 rounded-[3px] border border-line bg-transparent px-3 text-sm font-normal transition-colors focus:border-forest focus:ring-1 focus:ring-forest"/>
          </label>
        </div>
        {error&&<p role="alert" className="mt-5 rounded-[2px] bg-red-50 p-3 text-sm text-red-800 border border-red-100">{error}</p>}
        <button disabled={busy} className="mt-8 flex h-11 w-full items-center justify-center rounded-[3px] bg-forest text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:opacity-50">{busy?"Logging in…":"Log in"}</button>
        <p className="mt-6 text-center text-sm text-muted">New to GharDekho? <Link href="/register" className="font-semibold text-forest underline hover:text-forest-deep">Create an account</Link></p>
      </form>
    </div>
  </div>;
}
