"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import { useState } from "react";

export function FallbackImage({
  src, alt, sizes, className = "", fallbackLabel = "Image unavailable", priority = false, unoptimized = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  fallbackLabel?: string;
  priority?: boolean;
  unoptimized?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div role="img" aria-label={alt} className="absolute inset-0 grid place-items-center overflow-hidden bg-[linear-gradient(145deg,#edf2ee,#dfe8e2)] text-forest/50">
    <div className="flex flex-col items-center gap-2"><Building2 size={30} strokeWidth={1.2} aria-hidden="true" /><span className="sr-only">{fallbackLabel}</span></div>
  </div>;
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={unoptimized} onError={() => setFailed(true)} className={className} />;
}
