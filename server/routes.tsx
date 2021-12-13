import { log, path, React, ReactDOMServer, Router } from "./deps.ts";
import {
  getArticles,
  getFeeds,
  getFeedStats,
  getUser,
  getUserByEmail,
  updateArticleFlags,
} from "./database/mod.ts";
import { AppState, Article, UpdateArticleRequest, User } from "../types.ts";
import App, { AppProps } from "../client/components/App.tsx";
import { formatArticles, refreshFeeds } from "./feed.ts";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

function toString(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

export function createRouter(bundle: { path: string; text: string }) {
  // Render the base HTML
  const render = (initialState: AppProps) => {
    const preloadedState = `globalThis.__PRELOADED_STATE__ = ${
      toString(initialState)
    };`;
    const renderedApp = ReactDOMServer.renderToString(
      <App {...initialState} />,
    );

    const logo = Deno.readTextFileSync(
      path.join(__dirname, "..", "public", "favicon.svg"),
    ).replace(/\bsvg\b/g, 'symbol');

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

        <link rel="stylesheet" href="/styles.css">
        <script>${preloadedState}</script>
        <script type="module" async src="${bundle.path}"></script>
      </head>
      <body>
        <svg style="display:none" version="2.0">
          <defs>
            ${logo}
          </defs>
        </svg>
        <div id="root">${renderedApp}</div>
      </body>
    </html>`;
  };

  const router = new Router<AppState>();

  router.get("/user", ({ response, state }) => {
    const user = getUser(state.userId);
    response.type = "application/json";
    response.body = user;
  });

  router.get(bundle.path, ({ response }) => {
    response.type = "application/javascript";
    response.body = bundle.text;
  });

  router.get("/articles", async ({ cookies, request, response, state }) => {
    const params = request.url.searchParams;
    const feedIdsList = params.get("feeds");
    const { userId } = state;

    let articles: Article[];

    if (feedIdsList) {
      log.debug(`getting feeds: ${feedIdsList}`);
      const feedIds = feedIdsList.split(",").map(Number);
      await cookies.set("selectedFeeds", feedIds.map(String).join(","));
      articles = getArticles({ userId, feedIds });
    } else {
      articles = getArticles({ userId });
    }

    response.type = "application/json";
    response.body = articles;
  });

  router.patch("/articles", async ({ request, response }) => {
    if (request.hasBody) {
      const body = request.body();
      const data = await body.value as UpdateArticleRequest;
      const user = getUserByEmail("jason@jasoncheatham.com");
      updateArticleFlags(user.id, data);
    }
    response.status = 204;
  });

  router.get("/refresh", async ({ response }) => {
    await refreshFeeds();
    response.status = 204;
  });

  router.get("/reprocess", ({ response }) => {
    formatArticles();
    response.status = 204;
  });

  router.get("/feeds", ({ request, response, state }) => {
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
            ...group.feeds.map(({ id }) => id),
          ];
        }, []);
      }
    }

    response.type = "application/json";
    response.body = feedIds ? getFeeds(feedIds) : {};
  });

  router.get("/feedstats", ({ request, response, state }) => {
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
            ...group.feeds.map(({ id }) => id),
          ];
        }, []);
      }
    }

    response.type = "application/json";
    response.body = feedIds ? getFeedStats({ userId, feedIds }) : {};
  });

  router.get("/", async ({ cookies, response, state }) => {
    let user: User;

    if (state.userId) {
      user = getUser(state.userId);
    } else {
      user = getUserByEmail("jason@jasoncheatham.com");
      state.userId = user.id;
      await cookies.set("userId", `${user.id}`);
    }

    response.type = "text/html";

    const selectedFeedsStr = await cookies.get("selectedFeeds");
    if (selectedFeedsStr) {
      const { userId } = state;
      const selectedFeeds = selectedFeedsStr.split(",").map(Number);
      const articles = getArticles({
        feedIds: selectedFeeds,
        userId,
      });
      const feedStats = getFeedStats({ userId });
      response.body = render({ user, selectedFeeds, articles, feedStats });
    } else {
      response.body = render({ user });
    }
  });

  return router;
}
