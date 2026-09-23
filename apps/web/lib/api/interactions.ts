import type { ApiSuccess } from "@ghardekho/types";
import { apiRequest } from "./client";

export function createInquiry(id: string, input: { message: string; phone?: string }) {
  return apiRequest<ApiSuccess<{ id: string }>>(`/api/v1/properties/${encodeURIComponent(id)}/inquiries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

export function requestVisit(id: string, input: { requestedAt: string; message?: string }) {
  return apiRequest<ApiSuccess<{ id: string }>>(`/api/v1/properties/${encodeURIComponent(id)}/visits`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}
