import { PropertyForm } from "@/components/dashboard/property-form";

export const metadata = { title: "Post a property" };

export default function NewPropertyPage() {
  return <><p className="eyebrow">A new listing</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Post a property</h1><p className="mb-7 mt-3 max-w-2xl text-sm leading-6 text-muted">Share accurate details to create a draft listing. New submissions are not published automatically.</p><PropertyForm mode="create"/></>;
}
