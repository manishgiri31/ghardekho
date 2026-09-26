import { propertySearchSchema } from "@ghardekho/validation";
import type { PropertySearchInput, PropertySearchRequest } from "@ghardekho/validation";
import type { ApiListSuccess, PublicPropertyRecord } from "@ghardekho/types";

export type DiscoveryResult = ApiListSuccess<PublicPropertyRecord> | null;
export type DiscoveryState = "loading" | "error" | "empty" | "results";

const apiFilterKeys = [
  "q", "city", "locality", "propertyType", "listingType", "minPrice", "maxPrice", "bedrooms",
  "minBedrooms", "maxBedrooms", "minArea", "maxArea", "furnishing", "page", "limit", "sort",
] as const satisfies readonly (keyof PropertySearchInput)[];

const landingCategories = {
  apartments: { label: "Apartments", propertyType: "APARTMENT" },
  villas: { label: "Villas", propertyType: "VILLA" },
  homes: { label: "Independent homes", propertyType: "HOUSE" },
  plots: { label: "Plots & land", propertyType: "PLOT" },
  projects: { label: "New projects", propertyType: undefined },
} as const;

export type LandingCategory = keyof typeof landingCategories;

export function parseDiscoveryQuery(query: string) {
  const params = new URLSearchParams(query);
  // This is a presentation mode only; the property API does not have project data.
  params.delete("category");
  if (params.get("sort") === "area") params.set("sort", "area_desc");
  return propertySearchSchema.safeParse(Object.fromEntries(params));
}

export function discoveryApiQuery(filters: PropertySearchRequest) {
  const params = new URLSearchParams();
  for (const key of apiFilterKeys) {
    const value = filters[key];
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

export function updateDiscoveryQuery(query: string, updates: Partial<PropertySearchInput>) {
  const params = new URLSearchParams(query);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) params.delete(key);
    else params.set(key, String(value));
  }
  return params.toString();
}

export function getDiscoveryState({ loading, error, result }: { loading: boolean; error: string; result: DiscoveryResult }): DiscoveryState {
  if (loading) return "loading";
  if (error) return "error";
  return result?.data.length ? "results" : "empty";
}

export function propertyDetailsHref(slug: string) {
  return `/properties/${encodeURIComponent(slug)}`;
}

export function propertyCategoryHref(category: LandingCategory) {
  if (category === "projects") return "/properties?category=projects";
  const config = landingCategories[category];
  return `/properties?propertyType=${config.propertyType}`;
}

export function getLandingCategory(query: string) {
  const category = new URLSearchParams(query).get("category");
  return category && category in landingCategories ? landingCategories[category as LandingCategory] : null;
}
