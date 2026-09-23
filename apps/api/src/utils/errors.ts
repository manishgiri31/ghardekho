export class ApiError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message = "Invalid request.") => new ApiError(400, "VALIDATION_ERROR", message);
export const unauthorized = (message = "Authentication required.") => new ApiError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "You do not have permission to perform this action.") => new ApiError(403, "FORBIDDEN", message);
export const notFound = (message = "Resource not found.") => new ApiError(404, "NOT_FOUND", message);
