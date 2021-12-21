import { log, path, React, ReactDOMServer, Router } from "./deps.ts";
import {
  getArticles,
  getFeeds,
  getFeedStats,
  getUser,
  getUserArticles,
  getUserByEmail,
  isUserPassword,
  updateUserArticles,
} from "./database/mod.ts";
import { AppState, LoginRequest, UpdateUserArticleRequest } from "../types.ts";
import App, { AppProps } from "../client/App.tsx";
import { formatArticles, refreshFeeds } from "./feed.ts";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

function toString(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

const mode = Deno.env.get("SN_MODE") ?? "production";

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

        <link rel="stylesheet" href="/styles.css">
        <script type="module" async src="${bundle.path}"></script>
      </head>
      <body>
        <svg style="display:none" version="2.0">
          <defs>
            ${logo}
          </defs>
        </svg>
        <div id="root">${renderedApp}</div>
        <script>${preloadedState}</script>
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
    let feedIds: number[] | undefined;

    if (feedIdsList) {
      log.debug(`getting feeds: ${feedIdsList}`);
      feedIds = feedIdsList.split(",").map(Number);
      await cookies.set("selectedFeeds", feedIds.map(String).join(","));
    } else {
      const user = getUser(state.userId);
      feedIds = user.config?.feedGroups?.reduce((allFeeds, group) => {
        allFeeds.push(...group.feeds);
        return allFeeds;
      }, [] as number[]);
    }

    response.type = "application/json";
    response.body = feedIds ? getArticles(feedIds) : [];
  });

  router.patch("/user_articles", async ({ request, response, state }) => {
    if (request.hasBody) {
      const body = request.body();
      const data = await body.value as UpdateUserArticleRequest;
      updateUserArticles(state.userId, data);
    }
    response.status = 204;
  });

  router.get(
    "/user_articles",
    ({ request, response, state }) => {
      const params = request.url.searchParams;
      const feedIdsList = params.get("feeds");
      let feedIds: number[] | undefined = state.selectedFeeds;

      if (feedIdsList) {
        feedIds = feedIdsList.split(",").map(Number);
      }

      const { userId } = state;
      const userArticles = getUserArticles({ userId, feedIds });

      response.type = "application/json";
      response.body = userArticles;
    },
  );

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
            ...group.feeds,
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
    const user = getUserByEmail(data.email);

    if (!isUserPassword(user.id, data.password)) {
      response.status = 404;
      response.body = { error: "Missing or invalid credentials" };
      return;
    }

    state.userId = user.id;
    await cookies.set("userId", `${user.id}`, {
      secure: mode !== "dev",
      httpOnly: mode !== "dev",
      // assume we're being proxied through an SSL server
      ignoreInsecure: true,
    });

    response.body = user;
  });

  router.get("/", ({ response, state }) => {
    if (!state.userId) {
      response.redirect("/login");
      return;
    }

    const { userId, selectedFeeds } = state;
    const user = getUser(userId);
    const articles = selectedFeeds ? getArticles(selectedFeeds) : undefined;
    const feeds = selectedFeeds ? getFeeds(selectedFeeds) : undefined;
    const feedStats = getFeedStats({ userId });
    const userArticles = selectedFeeds
      ? getUserArticles({ feedIds: selectedFeeds, userId })
      : undefined;

    response.type = "text/html";
    response.body = render({
      user,
      selectedFeeds,
      articles,
      feeds,
      feedStats,
      userArticles,
    });
  });

  return router;
}
