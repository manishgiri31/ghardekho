import Link from "next/link";

export function UnavailablePanel({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return <section className="border border-line bg-white p-6 sm:p-9"><p className="eyebrow">Not available yet</p><h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>{actionHref && actionLabel && <Link href={actionHref} className="mt-6 inline-flex text-sm font-semibold text-forest underline underline-offset-4">{actionLabel}</Link>}</section>;
}
