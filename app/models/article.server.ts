import type { Article, Feed, User, UserArticle } from '@prisma/client';
import { prisma } from '~/lib/db';

export type ArticleHeading = Pick<
  Article,
  'id' | 'feedId' | 'articleId' | 'title' | 'link' | 'published'
>;

export type ArticleUserData = Omit<UserArticle, 'userId' | 'articleId'>;

export type ArticleHeadingWithUserData = Pick<
  Article,
  'id' | 'feedId' | 'articleId' | 'title' | 'link' | 'published'
> & {
  userData: ArticleUserData | undefined;
};

export type ArticleWithUserData = Article & {
  userData: ArticleUserData | undefined;
};

export async function getArticle({
  id,
}: {
  id: Article['id'];
}): Promise<Article | null> {
  return prisma.article.findUnique({
    where: { id },
  });
}

export async function getUserArticle({
  id,
  userId,
}: {
  id: Article['id'];
  userId: User['id'];
}): Promise<ArticleWithUserData | null> {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      users: {
        where: {
          userId,
        },
        select: {
          read: true,
          saved: true,
        },
      },
    },
  });

  if (!article) {
    return null;
  }

  const { users, ...other } = article;
  return {
    ...other,
    userData: users[0],
  };
}

export async function getArticleHeadings({
  feedIds,
}: {
  feedIds: Feed['id'][];
}): Promise<ArticleHeading[] | null> {
  return prisma.article.findMany({
    where: {
      feedId: {
        in: feedIds,
      },
    },
    select: {
      id: true,
      feedId: true,
      articleId: true,
      title: true,
      link: true,
      published: true,
    },
  });
}

export async function getUserArticleHeadings({
  feedIds,
  userId,
}: {
  feedIds: Feed['id'][];
  userId: User['id'];
}): Promise<ArticleHeadingWithUserData[] | null> {
  const articles = await prisma.article.findMany({
    where: {
      feedId: {
        in: feedIds,
      },
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
          userId,
        },
        select: {
          read: true,
          saved: true,
        },
      },
    },
    orderBy: {
      published: 'asc',
    },
  });

  if (!articles) {
    return null;
  }

  return articles.map((article) => {
    const { users, ...other } = article;
    return {
      ...other,
      userData: users[0],
    };
  });
}

export async function getArticleAndMarkRead({
  id,
  userId,
}: {
  id: Article['id'];
  userId: User['id'];
}): Promise<ArticleWithUserData> {
  const article = await prisma.article.update({
    where: {
      id,
    },
    data: {
      users: {
        upsert: {
          where: {
            userId_articleId: {
              articleId: id,
              userId,
            },
          },
          create: {
            userId,
            read: true,
          },
          update: {
            read: true,
          },
        },
      },
    },
    include: {
      users: {
        select: {
          read: true,
          saved: true,
        },
      },
    },
  });

  const { users, ...other } = article;
  return {
    ...other,
    userData: users[0],
  };
}

export function updateArticleUserData({
  id,
  userId,
  userData,
}: {
  id: Article['id'];
  userId: User['id'];
  userData: Partial<ArticleUserData>;
}): Promise<ArticleUserData> {
  return prisma.userArticle.upsert({
    where: {
      userId_articleId: {
        articleId: id,
        userId,
      },
    },
    create: {
      ...userData,
      userId,
      articleId: id,
    },
    update: {
      ...userData,
    },
    select: {
      read: true,
      saved: true,
    },
  });
}

export async function updateArticlesUserData({
  ids,
  userId,
  userData,
}: {
  ids: Article['id'][];
  userId: User['id'];
  userData: Partial<ArticleUserData>;
}): Promise<(ArticleUserData & { articleId: Article['id'] })[]> {
  return await prisma.$transaction(
    ids.map((id) =>
      prisma.userArticle.upsert({
        where: {
          userId_articleId: {
            articleId: id,
            userId,
          },
        },
        create: {
          ...userData,
          userId,
          articleId: id,
        },
        update: {
          ...userData,
        },
        select: {
          articleId: true,
          read: true,
          saved: true,
        },
      })
    )
  );
}
