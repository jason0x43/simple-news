import { log, path, React, ReactDOMServer, Router } from "./deps.ts";
import {
  getArticles,
  getFeeds,
  getFeedStats,
  getUser,
  getUserByEmail,
  isUserPassword,
  updateArticleFlags,
} from "./database/mod.ts";
import {
  AppState,
  Article,
  LoginRequest,
  UpdateArticleRequest,
  User,
} from "../types.ts";
import App, { AppProps } from "../client/components/App.tsx";
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
      response.status = 404;
      response.body = { error: "Missing or invalid credentials" };
      return;
    }

    const body = request.body();
    const text = await body.value;
    const data = JSON.parse(text) as LoginRequest;
    const user = getUserByEmail(data.email);
    if (!isUserPassword(user.id, data.password)) {
      response.status = 404;
      response.body = { error: "Missing or invalid credentials" };
    }

    state.userId = user.id;
    await cookies.set("userId", `${user.id}`, {
      secure: mode !== "dev",
      httpOnly: true,
    });

    response.body = user;
  });

  router.get("/", async ({ cookies, response, state }) => {
    if (!state.userId) {
      response.redirect("/login");
      return;
    }

    const user = getUser(state.userId);

    response.type = "text/html";

    const selectedFeedsStr = await cookies.get("selectedFeeds");
    const feedStats = getFeedStats({ userId: user.id });

    if (user && selectedFeedsStr) {
      const selectedFeeds = selectedFeedsStr.split(",").map(Number);
      const articles = getArticles({
        feedIds: selectedFeeds,
        userId: user.id,
      });
      response.body = render({ user, selectedFeeds, articles, feedStats });
    } else {
      response.body = render({ user, feedStats });
    }
  });

  return router;
}
