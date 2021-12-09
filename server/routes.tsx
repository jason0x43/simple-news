import { log, React, ReactDOMServer, Router } from "./deps.ts";
import {
  getArticles,
  getReadArticleIds,
  getUser,
  getUserByEmail,
  setArticlesRead,
} from "./database/mod.ts";
import { AppState, Article, UpdateArticleRequest, User } from "../types.ts";
import App from "../client/App.tsx";
import { formatArticles, refreshFeeds } from "./feed.ts";

function toString(value: unknown): string {
  return JSON.stringify(JSON.stringify(value ?? null));
}

export function createRouter(bundle: { path: string; text: string }) {
  // Render the base HTML
  const render = (
    user: User,
    selectedFeeds?: number[],
    articles?: Article[],
  ) => {
    const globalData = user
      ? `globalThis.appProps = {
        user: JSON.parse(${toString(user)}),
        selectedFeeds: JSON.parse(${toString(selectedFeeds)}),
        articles: JSON.parse(${toString(articles)})
      };`
      : "";

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
        <script>${globalData}</script>
        <script type="module" src="${bundle.path}"></script>
      </head>
      <body>
      <div id="root">${
      ReactDOMServer.renderToString(
        <App user={user} selectedFeeds={selectedFeeds} articles={articles} />,
      )
    }</div>
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
    let articles: Article[];

    const feedIdsList = params.get("feeds");
    if (feedIdsList) {
      log.debug(`getting feeds: ${feedIdsList}`);
      const feedIds = feedIdsList.split(",").map(Number);
      await cookies.set("selectedFeeds", feedIds.map(String).join(","));
      articles = getArticles({ feedIds });
    } else {
      articles = getArticles();
    }

    const user = getUser(state.userId);
    const readIds = getReadArticleIds(user.id);
    articles = articles.map((article) => ({
      ...article,
      read: readIds.includes(article.id),
    }));

    response.type = "application/json";
    response.body = articles;
  });

  router.patch("/articles", async ({ request, response }) => {
    if (request.hasBody) {
      const body = request.body();
      const data = await body.value as UpdateArticleRequest;
      const user = getUserByEmail("jason@jasoncheatham.com");
      setArticlesRead(user.id, data);
    }

    response.type = "application/json";
    response.status = 204;
  });

  router.get("/refresh", async ({ response }) => {
    await refreshFeeds();
    response.type = "application/json";
    response.body = { status: "OK" };
  });

  router.get("/reprocess", ({ response }) => {
    formatArticles();
    response.type = "application/json";
    response.body = { status: "OK" };
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

    const selectedFeeds = await cookies.get("selectedFeeds");
    if (selectedFeeds) {
      const feedIds = selectedFeeds.split(",").map(Number);
      const articles = getArticles({ feedIds, userId: state.userId });
      response.body = render(user, feedIds, articles);
    } else {
      response.body = render(user);
    }
  });

  return router;
}
