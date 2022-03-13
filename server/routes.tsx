// import to make SSR React (at least v17) happy
import "./raf.ts";
import * as path from "std/path/mod.ts";
import { Router } from "oak";
import * as log from "std/log/mod.ts";
import ReactDOMServer from "react-dom-server";
import React from "react";
import { Provider } from "react-redux";
import {
  getArticle,
  getArticleHeadings,
  getArticles,
  getFeeds,
  getFeedStats,
  getUser,
  getUserArticles,
  isUserPassword,
  updateUserArticles,
} from "./database/mod.ts";
import {
  AppState,
  LoginRequest,
  LoginResponse,
  UpdateUserArticleRequest,
} from "../types.ts";
import App from "../client/App.tsx";
import { formatArticles, refreshFeeds } from "./feed.ts";
import {
  AppState as ClientAppState,
  createStore,
} from "../client/store/mod.ts";
import { selectFeeds } from "../client/store/articlesSelectors.ts";
import { getUserByUsername } from "./database/users.ts";
import { addLiveReloadRoute } from "./reload.ts";
import { requireUser } from "./middleware.ts";
import { createSession, deleteSession } from "./sessions.ts";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const selectedFeedsCookie = "selectedFeeds";
const selectedArticleCookie = "selectedArticle";

function toString(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

export function createRouter(
  init: { client: string; styles: string; dev: boolean | undefined },
): Router<AppState> {
  const cookieOptions = {
    secure: !init.dev,
    httpOnly: true,
    // assume we're being proxied through an SSL server
    ignoreInsecure: true,
  };

  const getUserData = (userId: number): LoginResponse => {
    const user = getUser(userId);
    const feedIds = user.config?.feedGroups.reduce((allIds, group) => {
      allIds.push(...group.feeds);
      return allIds;
    }, [] as number[]);

    const feeds = getFeeds(feedIds);
    const feedStats = getFeedStats({ userId });

    return {
      user,
      feeds,
      feedStats,
    };
  };

  // Render the base HTML
  const render = (initialState: Partial<ClientAppState>) => {
    const store = createStore(initialState);

    const devMode = `globalThis.__DEV__ = ${init.dev ? "true" : "false"};`;
    const renderedApp = ReactDOMServer.renderToString(
      <Provider store={store}>
        <App />
      </Provider>,
    );
    const preloadedState = `globalThis.__PRELOADED_STATE__ = ${
      toString(store.getState())
    };`;

    const feeds = selectFeeds(store.getState());
    const faviconLinks = feeds?.filter((feed) => feed.icon).map(({ icon }) =>
      icon!
    ).map((icon) => `<link rel="preload" href="${icon}" as="image">`).join(
      "\n",
    );

    const logo = Deno.readTextFileSync(
      path.join(__dirname, "..", "public", "favicon.svg"),
    ).replace(/\bsvg\b/g, "symbol");

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Simple News</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-touch-fullscreen" content="yes">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/site.webmanifest">

        ${faviconLinks ?? ""}

        <link rel="stylesheet" href="/styles.css">
        <script type="module" async src="/client.js"></script>
      </head>
      <body>
        <svg style="display:none" version="2.0">
          <defs>
            ${logo}
          </defs>
        </svg>
        <div id="root">${renderedApp}</div>
        <script>
          ${preloadedState}
          ${devMode}
        </script>
      </body>
    </html>`;
  };

  const router = new Router<AppState>();

  addLiveReloadRoute(router);

  router.get("/client.js", ({ response }) => {
    response.type = "application/javascript";
    response.body = init.client;
  });

  router.get("/styles.css", ({ response }) => {
    response.type = "text/css";
    response.body = init.styles;
  });

  router.get("/user", requireUser, ({ response, state }) => {
    const user = getUser(state.userId);
    response.type = "application/json";
    response.body = user;
  });

  router.get(
    "/articles",
    requireUser,
    ({ request, response, state }) => {
      const params = request.url.searchParams;
      const feedIdsList = params.get("feeds");
      const brief = params.get("brief");
      const all = params.get("all");
      let feedIds: number[] | undefined;

      if (feedIdsList) {
        log.debug(`getting feeds: ${feedIdsList}`);
        feedIds = feedIdsList.split(",").map(Number);
      } else {
        const user = getUser(state.userId);
        feedIds = user.config?.feedGroups?.reduce((allFeeds, group) => {
          allFeeds.push(...group.feeds);
          return allFeeds;
        }, [] as number[]);
      }

      response.type = "application/json";

      if (feedIds) {
        const articles = brief
          ? getArticleHeadings(feedIds)
          : getArticles(feedIds);

        if (all) {
          response.body = articles;
        } else {
          const userArticles = getUserArticles({
            feedIds,
            userId: state.userId,
          });
          response.body = articles.filter((article) =>
            !userArticles[article.id]?.read
          );
        }
      } else {
        response.body = [];
      }
    },
  );

  router.get("/articles/:id", requireUser, ({ params, response }) => {
    const { id } = params;

    response.type = "application/json";

    try {
      const article = getArticle(id);
      response.body = article;
    } catch (error) {
      response.status = 404;
      response.body = { error: `${error.message}` };
    }
  });

  router.patch(
    "/user_articles",
    requireUser,
    async ({ cookies, request, response, state }) => {
      if (request.hasBody) {
        const body = request.body();
        const data = await body.value as UpdateUserArticleRequest;
        updateUserArticles(state.userId, data);

        if (data.length === 1 && data[0].isSelected) {
          await cookies.set(
            selectedArticleCookie,
            `${data[0].articleId}`,
            cookieOptions,
          );
        }
      }
      response.status = 204;
    },
  );

  router.get(
    "/user_articles",
    requireUser,
    ({ request, response, state }) => {
      const params = request.url.searchParams;
      const feedIdsList = params.get("feeds");
      let feedIds: number[] | undefined;

      if (feedIdsList) {
        feedIds = feedIdsList.split(",").map(Number);
      }

      const { userId } = state;
      const userArticles = getUserArticles({ userId, feedIds });

      response.type = "application/json";
      response.body = userArticles;
    },
  );

  router.get("/refresh", requireUser, async ({ response }) => {
    await refreshFeeds();
    response.status = 204;
  });

  router.get("/reprocess", requireUser, ({ response }) => {
    formatArticles();
    response.status = 204;
  });

  router.get(
    "/feeds",
    requireUser,
    async ({ cookies, request, response, state }) => {
      const params = request.url.searchParams;
      const feedIdsList = params.get("feeds");
      const { userId } = state;
      let feedIds: number[] | undefined;

      if (feedIdsList) {
        feedIds = feedIdsList.split(",").map(Number);
        await cookies.set(selectedFeedsCookie, feedIdsList, cookieOptions);
      } else {
        const user = getUser(userId);
        if (user.config) {
          feedIds = user.config?.feedGroups.reduce<number[]>(
            (allIds, group) => {
              return [
                ...allIds,
                ...group.feeds,
              ];
            },
            [],
          );
        }
      }

      response.type = "application/json";
      response.body = feedIds ? getFeeds(feedIds) : {};
    },
  );

  router.get("/feedstats", requireUser, ({ request, response, state }) => {
    const params = request.url.searchParams;
    const feedIdsList = params.get("feeds");
    const { userId } = state;
    let feedIds: number[] | undefined;

    if (feedIdsList) {
      feedIds = feedIdsList.split(",").map(Number);
    } else {
      const user = getUser(userId);
      if (user.config) {
        feedIds = user.config?.feedGroups.reduce<number[]>((allIds, group) => {
          return [
            ...allIds,
            ...group.feeds,
          ];
        }, []);
      }
    }

    response.type = "application/json";
    response.body = feedIds ? getFeedStats({ userId, feedIds }) : {};
  });

  router.get("/login", ({ response, state }) => {
    if (state.userId) {
      response.redirect("/");
    } else {
      response.type = "text/html";
      response.body = render({});
    }
  });

  router.post("/login", async ({ cookies, request, response, state }) => {
    response.type = "application/json";

    if (!request.hasBody) {
      response.status = 400;
      response.body = { error: "Missing or invalid credentials" };
      return;
    }

    const body = request.body();
    const data = await body.value as LoginRequest;
    const user = getUserByUsername(data.username);

    if (!isUserPassword(user.id, data.password)) {
      response.status = 400;
      response.body = { error: "Missing or invalid credentials" };
      return;
    }

    state.userId = user.id;
    await createSession({ userId: user.id, cookies, cookieOptions });

    response.body = getUserData(user.id);
  });

  router.get("/logout", async ({ response, cookies }) => {
    await deleteSession({ cookies, cookieOptions });
    await cookies.set(selectedFeedsCookie, "", cookieOptions);

    response.type = "application/json";
    response.body = { success: true };
  });

  router.get("/", async ({ cookies, response, state }) => {
    if (!state.userId) {
      response.redirect("/login");
      return;
    }

    const feedIdsList = await cookies.get(selectedFeedsCookie);
    const feedIds: number[] | undefined = feedIdsList?.split(",").map(Number);

    const selectedArticle = await cookies.get(selectedArticleCookie);
    const selectedArticleId = selectedArticle
      ? Number(selectedArticle)
      : undefined;

    const { userId } = state;
    const data = getUserData(userId);
    const articles = getArticleHeadings(feedIds);
    const userArticles = getUserArticles({ feedIds, userId });
    const unreadArticles = articles.filter((article) =>
      !userArticles[article.id]?.read || article.id === selectedArticleId
    );

    response.type = "text/html";
    response.body = render({
      user: {
        user: data.user,
      },
      articles: {
        articles: unreadArticles,
        feeds: data.feeds,
        feedStats: data.feedStats,
        userArticles,
        selectedFeeds: feedIds ?? [],
      },
    });
  });

  return router;
}
