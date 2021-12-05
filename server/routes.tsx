import { log, React, ReactDOMServer, Router } from "./deps.ts";
import { getArticles, getUserByEmail, setArticleRead } from "./database/mod.ts";
import { UpdateArticleRequest, User } from "../types.ts";
import App from "../client/App.tsx";
import { formatArticles, refreshFeeds } from "./feed.ts";

export function createRouter(bundle: { path: string; text: string }) {
  // Render the base HTML
  const render = (user: User) =>
    `<!DOCTYPE html>
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

        <link rel="preconnect" href="https://fonts.googleapis.com"> 
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> 
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/styles.css">
        ${
      user
        ? `<script>
                globalThis.appProps = {
                  user: JSON.parse(${JSON.stringify(JSON.stringify(user))})
                };
                </script>`
        : ""
    }
        <script type="module" src="${bundle.path}"></script>
      </head>
      <body>
      <div id="root">${ReactDOMServer.renderToString(<App user={user} />)}</div>
      </body>
    </html>`;

  const router = new Router();

  router.get("/user", ({ response }) => {
    const user = getUserByEmail("jason@jasoncheatham.com");
    response.type = "application/json";
    response.body = user;
  });

  router.get(bundle.path, ({ response }) => {
    response.type = "application/javascript";
    response.body = bundle.text;
  });

  router.get("/articles", ({ request, response }) => {
    const params = request.url.searchParams;
    let articles: unknown[];
    const feedIdsList = params.get('feeds');
    if (feedIdsList) {
      log.debug(`getting feeds: ${feedIdsList}`);
      const feedIds = feedIdsList.split(',').map(Number);
      articles = getArticles({ feedIds });
    } else {
      articles = getArticles();
    }
    response.type = "application/json";
    response.body = articles;
  });

  router.get("/refresh", async ({ response }) => {
    await refreshFeeds();
    response.type = "application/json";
    response.body = { status: "OK" };
  });

  router.put("/articles", async ({ request, response }) => {
    if (request.hasBody) {
      const body = request.body();
      const data = await body.value as UpdateArticleRequest;
      const user = getUserByEmail("jason@jasoncheatham.com");
      for (const entry of data) {
        setArticleRead({
          articleId: entry.articleId,
          userId: user.id,
        }, entry.read);
        log.debug(`Set article ${entry.articleId} as read for ${user.id}`);
      }
    }

    response.type = "application/json";
    response.body = { status: "OK" };
  });

  router.get("/reprocess", ({ response }) => {
    formatArticles();
    response.type = "application/json";
    response.body = { status: "OK" };
  });

  router.get("/", ({ response }) => {
    const user = getUserByEmail("jason@jasoncheatham.com");
    response.type = "text/html";
    response.body = render(user);
  });

  return router;
}
