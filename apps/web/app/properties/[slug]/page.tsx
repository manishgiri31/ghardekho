import type { Metadata } from "next";
import { getProperty } from "@/lib/api/properties";
import DetailsClient from "./details-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { data } = await getProperty(slug);
    return {
      title: data.title,
      description: `${data.title} in ${data.locality}, ${data.city}. ${data.bedrooms ?? ""} bedrooms, ${Number(data.area).toLocaleString("en-IN")} ${data.areaUnit.toLowerCase()}.`,
      alternates: { canonical: `/properties/${encodeURIComponent(data.slug)}` },
      openGraph: { type: "website", title: data.title, description: `${data.locality}, ${data.city} · GharDekho`, images: data.media?.filter((media) => media.type === "IMAGE").slice(0, 1).map((media) => media.url) },
    };
  } catch { return { title: "Property details", description: "Explore property details on GharDekho." }; }
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DetailsClient slug={slug} />;
}
