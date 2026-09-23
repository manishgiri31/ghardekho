import { Suspense } from "react";
import { Discovery } from "@/components/properties/discovery";

export const metadata = { title: "Homes for sale and rent", description: "Explore published homes and properties across India." };

export default function PropertiesPage() {
  return <Suspense fallback={<div className="container py-20">Loading property search…</div>}><Discovery /></Suspense>;
}
