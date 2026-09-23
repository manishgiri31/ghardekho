import type { ApiSuccess, PublicUser } from "@ghardekho/types";
import type { LoginInput, RegistrationInput } from "@ghardekho/validation";
import { apiRequest } from "./client";

export function registerAccount(input: RegistrationInput) {
  return apiRequest<ApiSuccess<{ user: PublicUser }>>("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput) {
  return apiRequest<ApiSuccess<{ user: PublicUser }>>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiRequest<ApiSuccess<{ loggedOut: boolean }>>("/api/v1/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return apiRequest<ApiSuccess<{ user: PublicUser }>>("/api/v1/auth/me");
}
