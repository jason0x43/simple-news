import type { SessionWithUser } from '$lib/db/session.js';
import type { User } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { handle, getSession } from './hooks.js';

vi.mock('cookie', () => {
  return {
    parse: vi.fn(() => {
      return {
        session: 'bar'
      };
    })
  };
});

vi.mock('$lib/db/session', () => {
  return {
    getSessionWithUser: vi.fn(async () => {
      return { sessionId: 'foo' };
    })
  };
});

describe('hooks', () => {
  describe('handle', () => {
    it('sets the session', async () => {
      const event = {
        request: {
          headers: new Headers()
        },
        locals: {}
      } as RequestEvent;
      const resolve = vi.fn(
        (event: RequestEvent) =>
          ({
            resolvedEvent: event
          } as unknown as Response)
      );
      const resolved = await handle({ event, resolve });
      expect(resolve).toHaveBeenCalled();
      expect(resolved).toBeDefined();
      expect(resolved).toEqual(resolve.mock.results[0].value);
      const resolvedEvent = resolve.mock.calls[0][0];
      expect(resolvedEvent.locals.session).toEqual({ sessionId: 'foo' });
    });
  });

  describe('getSession', () => {
    it('gets the session', () => {
      const result = getSession({
        locals: {
          session: {
            id: 'session-id',
            user: { name: 'session' } as unknown as User
          } as unknown as SessionWithUser
        }
      } as unknown as RequestEvent);
      expect(result).toEqual({
        id: 'session-id',
        user: { name: 'session' }
      });
    });

    it('works with no defined session', () => {
      const result = getSession({
        locals: {
          session: undefined
        }
      } as unknown as RequestEvent);
      expect(result).toEqual({
        id: undefined,
        user: undefined
      });
    });
  });
});
