import type { Article, Feed, User, UserArticle } from '@prisma/client';
import { prisma } from '$lib/db';

export type ArticleHeading = Pick<
  Article,
  'id' | 'feedId' | 'articleId' | 'title' | 'link' | 'published'
>;

export type ArticleUserData = Omit<UserArticle, 'userId' | 'articleId'>;

export type ArticleHeadingWithUserData = Omit<Article, 'content'> &
  ArticleUserData;

export type ArticleWithUserData = Article & ArticleUserData;

export async function getArticle({
  id,
  userId
}: {
  id: Article['id'];
  userId: User['id'];
}): Promise<ArticleWithUserData | null> {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      users: {
        where: {
          userId
        },
        select: {
          read: true,
          saved: true
        }
      }
    }
  });

  if (!article) {
    return null;
  }

  const { users, ...other } = article;
  return {
    ...other,
    ...users[0]
  };
}

export async function getArticleHeadings({
  feedIds,
  articleIds,
  userId
}: {
  feedIds?: Feed['id'][];
  articleIds?: Article['id'][];
  userId: User['id'];
}): Promise<ArticleHeadingWithUserData[]> {
  const articles = await prisma.article.findMany({
    where: {
      feedId: {
        in: feedIds
      },
      id: {
        in: articleIds
      }
    },
    select: {
      id: true,
      feedId: true,
      articleId: true,
      title: true,
      link: true,
      published: true,
      users: {
        where: {
          userId
        },
        select: {
          read: true,
          saved: true
        }
      }
    },
    orderBy: {
      published: 'asc'
    }
  });

  return articles.map((article) => {
    const { users, ...other } = article;
    return {
      ...other,
      ...users[0]
    };
  });
}

export function updateArticleUserData({
  id,
  userId,
  userData
}: {
  id: Article['id'];
  userId: User['id'];
  userData: Partial<ArticleUserData>;
}): Promise<ArticleUserData & Pick<UserArticle, 'articleId'>> {
  return prisma.userArticle.upsert({
    where: {
      userId_articleId: {
        articleId: id,
        userId
      }
    },
    create: {
      userId,
      articleId: id,
      ...userData
    },
    update: {
      ...userData
    },
    select: {
      articleId: true,
      read: true,
      saved: true
    }
  });
}

export async function updateArticlesUserData({
  articleIds,
  userId,
  userData
}: {
  articleIds: Article['id'][];
  userId: User['id'];
  userData: Partial<ArticleUserData>;
}): Promise<ArticleHeadingWithUserData[]> {
  await prisma.$transaction(
    articleIds.map((id) =>
      prisma.userArticle.upsert({
        where: {
          userId_articleId: {
            articleId: id,
            userId
          }
        },
        create: {
          ...userData,
          userId,
          articleId: id
        },
        update: {
          ...userData
        },
        select: {
          articleId: true,
          read: true,
          saved: true
        }
      })
    )
  );

  return getArticleHeadings({ articleIds, userId });
}
