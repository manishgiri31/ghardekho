import { UnavailablePanel } from "@/components/dashboard/unavailable-panel";

export default function MyPropertiesPage() {
  return <UnavailablePanel title="Your property listings" description="The current property API supports creating, reading by ID, updating, and archiving a listing, but it does not provide an endpoint to list the signed-in owner’s properties. This page stays empty of fabricated data until that endpoint exists." actionHref="/dashboard/properties/new" actionLabel="Post a property"/>;
}
