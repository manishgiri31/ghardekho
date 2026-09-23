import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="text-[30px] font-semibold leading-tight tracking-[-.04em] text-ink sm:text-[38px]">{title}</h2>
        {description && <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
