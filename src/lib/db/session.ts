import { prisma } from '$lib/db';
import type { ArticleFilter } from '$lib/types';
import type { Session, User } from '@prisma/client';

export type SessionWithUser = Session & {
  user: User;
};

export type SessionData = {
  articleFilter: ArticleFilter;
};

export const defaultSessionData: SessionData = {
  articleFilter: 'unread'
};

export async function createUserSession(userId: User['id']): Promise<Session> {
  return await prisma.session.create({
    data: {
      userId,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      data: JSON.stringify(defaultSessionData)
    }
  });
}

export async function getSessionWithUser(
  id: Session['id']
): Promise<SessionWithUser | undefined> {
  if (!id) {
    return undefined;
  }

  return (
    (await prisma.session.findUnique({
      where: {
        id
      },
      include: {
        user: {
          include: {
            feedGroups: {
              include: {
                feeds: {
                  include: {
                    feed: true
                  }
                }
              }
            }
          }
        }
      }
    })) ?? undefined
  );
}

export async function setSessionData(
  id: Session['id'],
  data: SessionData
): Promise<Session> {
  return prisma.session.update({
    where: {
      id
    },
    data: {
      data: JSON.stringify(data)
    }
  });
}
