const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiBaseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(new URL(path.replace(/^\//, ""), `${apiBaseUrl.replace(/\/$/, "")}/`), {
      ...init, signal: init.signal ?? controller.signal, credentials: "include",
      headers: { Accept: "application/json", ...init.headers },
    });
    const body = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    if (!response.ok) {
      const failure = body as { error?: { message?: string; code?: string } } | undefined;
      throw new ApiError(failure?.error?.message ?? `The request could not be completed (${response.status}).`, response.status, failure?.error?.code);
    }
    if (response.status === 204) return undefined as T;
    if (body === undefined) throw new ApiError("The server returned an unreadable response.", response.status);
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new ApiError("The request timed out. Please try again.", 408);
    throw new ApiError("Could not connect to GharDekho. Check your connection and try again.", 0);
  } finally { clearTimeout(timeout); }
}
