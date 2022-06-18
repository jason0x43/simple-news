import type { Article } from '@prisma/client';
import { writable } from 'svelte/store';
import type { ArticleHeadingWithUserData } from './db/article';
import type { ArticleFilter } from './types';

export const sidebarVisible = writable<boolean>(false);

export const articleFilter = writable<ArticleFilter>('unread');

export const displayType = writable<'mobile' | 'desktop'>('desktop');

export const updatedArticleIds = writable<Set<Article['id']>>(new Set());

export const articles = writable<ArticleHeadingWithUserData[] | undefined>();
