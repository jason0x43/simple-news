import type { RequestHandlerOutput } from '@sveltejs/kit';

export type ErrorResponse = {
  errors?: Record<string, string>;
};

export function errorResponse(
  errors: Record<string, string> | string,
  status?: number
): RequestHandlerOutput<ErrorResponse> {
  return {
    status: status ?? 400,
    body: {
      errors:
        typeof errors === 'string'
          ? {
              error: errors
            }
          : errors
    }
  };
}

export function unauthResponse() {
  return errorResponse('Missing session or user', 403);
}
