import { propertySearchSchema } from "@ghardekho/validation";
import type { PropertySearchInput, PropertySearchRequest } from "@ghardekho/validation";
import type { ApiListSuccess, PublicPropertyRecord } from "@ghardekho/types";

export type DiscoveryResult = ApiListSuccess<PublicPropertyRecord> | null;
export type DiscoveryState = "loading" | "error" | "empty" | "results";

export function parseDiscoveryQuery(query: string) {
  const params = new URLSearchParams(query);
  if (params.get("sort") === "area") params.set("sort", "area_desc");
  return propertySearchSchema.safeParse(Object.fromEntries(params));
}

export function discoveryApiQuery(filters: PropertySearchRequest) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

export function updateDiscoveryQuery(query: string, updates: Partial<Pick<PropertySearchInput, "page" | "sort">>) {
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
