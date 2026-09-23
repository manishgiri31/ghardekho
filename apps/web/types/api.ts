export type ApiResponse<T> = { success: true; data: T; message?: string };
export type ApiErrorResponse = { success: false; error: { code: string; message: string } };
