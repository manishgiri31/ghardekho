const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiBaseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  const response = await fetch(new URL(path.replace(/^\//, ""), `${apiBaseUrl.replace(/\/$/, "")}/`), {
    ...init,
    headers: { Accept: "application/json", ...init.headers },
  });
  if (!response.ok) {
    throw new ApiError(`API request failed with status ${response.status}.`, response.status);
  }
  return response.json() as Promise<T>;
}
