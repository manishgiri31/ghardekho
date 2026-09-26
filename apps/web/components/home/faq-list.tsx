import { faqs } from "@/lib/homepage-content";

export function FaqList() {
  return <div className="divide-y divide-line border-y border-line">
    {faqs.map((item, index) => <details key={item.question} className="group py-5" open={index === 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">{item.question}<span className="text-xl font-normal text-forest transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary>
      <p className="max-w-3xl pt-3 pr-8 text-sm leading-7 text-muted">{item.answer}</p>
    </details>)}
  </div>;
}
