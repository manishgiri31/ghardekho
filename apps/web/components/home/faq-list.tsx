"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { faqs } from "@/lib/homepage-content";

export function FaqList() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return <div className="divide-y divide-line/70 border-t border-line/70">
    {faqs.map((item, index) => {
      const isOpen = openIndex === index;
      return <div key={item.question} className="py-6 sm:py-8">
        <button onClick={() => setOpenIndex(isOpen ? null : index)} className="flex w-full items-start justify-between gap-6 text-left" aria-expanded={isOpen}>
          <h3 className="text-lg font-medium tracking-tight text-ink sm:text-[22px] sm:leading-[1.3]">{item.question}</h3>
          <span className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? "border-forest bg-forest text-white rotate-135" : "border-line text-ink hover:border-forest/40"}`} aria-hidden="true"><Plus size={16} strokeWidth={1.5} className={isOpen ? "rotate-45" : ""} /></span>
        </button>
        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <p className="max-w-[85%] pt-4 text-[15px] leading-relaxed text-muted sm:pt-5">{item.answer}</p>
          </div>
        </div>
      </div>;
    })}
  </div>;
}
