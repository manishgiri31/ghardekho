import type { ApiListSuccess, ApiSuccess, OwnerPropertyListSuccess, PropertyDetailsRecord, PropertyRecord, PublicPropertyRecord } from "@ghardekho/types";
import type { OwnerPropertySearchRequest, PropertyCreateRequest, PropertySearchRequest, PropertyUpdateRequest } from "@ghardekho/validation";
import { apiRequest } from "./client";

function queryString(filters: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters as Record<string, unknown>)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function searchProperties(filters: PropertySearchRequest = {}) {
  const query = queryString(filters);
  return apiRequest<ApiListSuccess<PublicPropertyRecord>>(`/api/v1/properties${query ? `?${query}` : ""}`);
}

export function getMyProperties(filters: OwnerPropertySearchRequest = {}) {
  const query = queryString(filters);
  return apiRequest<OwnerPropertyListSuccess>(`/api/v1/properties/mine${query ? `?${query}` : ""}`);
}

export function getProperty(id: string) {
  return apiRequest<ApiSuccess<PropertyDetailsRecord>>(`/api/v1/properties/${encodeURIComponent(id)}`);
}

export function createProperty(input: PropertyCreateRequest) {
  return apiRequest<ApiSuccess<PropertyRecord>>("/api/v1/properties", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
}

export function updateProperty(id: string, input: PropertyUpdateRequest) {
  return apiRequest<ApiSuccess<PropertyRecord>>(`/api/v1/properties/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
}

export function archiveProperty(id: string) {
  return apiRequest<void>(`/api/v1/properties/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function restoreProperty(id: string) {
  return apiRequest<ApiSuccess<PropertyRecord>>(`/api/v1/properties/${encodeURIComponent(id)}/restore`, { method: "PATCH" });
}
