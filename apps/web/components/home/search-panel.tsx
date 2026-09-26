"use client";

import { useState } from "react";
import { MapPin, Search } from "lucide-react";

export function SearchPanel() {
  const [intent, setIntent] = useState<"Buy" | "Rent">("Buy");
  return (
    <div className="w-full max-w-[800px] bg-white p-3 shadow-[0_18px_55px_rgba(5,36,29,.18)] sm:p-4">
      <div className="flex gap-1 border-b border-line px-1">
        {(["Buy", "Rent"] as const).map((option) => <button key={option} type="button" onClick={() => setIntent(option)} aria-pressed={intent === option} className={`relative px-4 pb-3 pt-1 text-sm font-semibold transition-colors ${intent === option ? "text-forest" : "text-muted hover:text-ink"}`}>
          {option}{intent === option && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-gold" />}
        </button>)}
      </div>
      <form action="/properties" method="get" className="grid gap-2 pt-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center sm:gap-0 sm:pt-4">
        <input type="hidden" name="listingType" value={intent === "Buy" ? "SALE" : "RENT"} />
        <label className="flex min-h-12 items-center gap-2 border-b border-line px-2 sm:border-b-0 sm:border-r sm:px-3">
          <MapPin size={17} className="shrink-0 text-forest" aria-hidden="true" />
          <span className="sr-only">City or locality</span>
          <input name="q" placeholder="City, locality or landmark" className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
        </label>
        <label className="flex min-h-12 items-center border-b border-line px-3 sm:border-b-0 sm:border-r">
          <span className="sr-only">Property type</span>
          <select name="propertyType" defaultValue="" className="w-full bg-transparent text-sm text-muted outline-none"><option value="">Property type</option><option value="APARTMENT">Apartment</option><option value="VILLA">Villa</option><option value="HOUSE">Independent house</option><option value="PLOT">Plot</option></select>
        </label>
        <label className="flex min-h-12 items-center border-b border-line px-3 sm:border-b-0">
          <span className="sr-only">Budget</span>
          <select name="maxPrice" defaultValue="" className="w-full bg-transparent text-sm text-muted outline-none"><option value="">Any budget</option><option value="5000000">Up to ₹50 lakh</option><option value="10000000">Up to ₹1 crore</option><option value="50000000">Up to ₹5 crore</option></select>
        </label>
        <button type="submit" className="flex min-h-12 items-center justify-center gap-2 bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"><Search size={16} />Search homes</button>
      </form>
    </div>
  );
}
