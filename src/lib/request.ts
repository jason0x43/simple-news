import type { RequestHandlerOutput } from '@sveltejs/kit';
import { ResponseError } from './error';

export type ErrorResponse<
  T extends Record<string, string> | string = Record<string, string | string>
> = {
  errors: T;
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

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    value != null &&
    typeof value === 'object' &&
    (value as ErrorResponse).errors !== undefined
  );
}

export function isRequestOutput(value: unknown): value is RequestHandlerOutput {
  return (
    (value != null &&
      typeof value === 'object' &&
      typeof (value as Record<string, unknown>).status === 'number') ||
    typeof (value as Record<string, unknown>).body === 'object'
  );
}

export function unauthResponse() {
  return errorResponse('Missing session or user', 403);
}

/**
 * Make a POST request
 */
export async function post<T = unknown, R = unknown>(
  path: string,
  data: T
): Promise<R> {
  const resp = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    }
  });
  if (resp.status >= 400) {
    const body = await resp.text();
    throw new ResponseError('POST', path, resp.status, resp.statusText, body);
  }
  return (await resp.json()) as R;
}

/**
 * Make a PUT request
 */
export async function put<T = unknown, R = unknown>(
  path: string,
  data: T
): Promise<R> {
  const resp = await fetch(path, {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    }
  });
  if (resp.status >= 400) {
    const body = await resp.text();
    throw new ResponseError('PUT', path, resp.status, resp.statusText, body);
  }
  return (await resp.json()) as R;
}

export async function fetchData<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  return (await resp.json()) as T;
}

export function getQueryParam(params: URLSearchParams, key: string): string {
  const val = params.get(key);
  if (val === null) {
    throw new Error(`Missing required param ${key}`);
  }
  return val;
}
