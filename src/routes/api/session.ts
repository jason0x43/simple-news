import type { RequestHandler } from './__types/session';
import {
  errorResponse,
  unauthResponse,
  type ErrorResponse
} from '$lib/request';
import { setSessionData, type SessionData } from '$lib/db/session';

export type UpdateSessionRequest = SessionData;

export type UpdateSessionResponse = Record<string, never> | ErrorResponse;

/**
 * Update session data
 */
export const PUT: RequestHandler = async function ({ locals, request }) {
  if (!locals.session || !locals.session.user) {
    return unauthResponse();
  }

  const data: UpdateSessionRequest = await request.json();

  if (typeof data.articleFilter !== 'string') {
    return errorResponse({
      feedId: 'An articleFilter must be provided'
    });
  }

  try {
    setSessionData(locals.session.id, data);
  } catch (error) {
    return errorResponse(`${error}`, 500);
  }

  return {};
};
