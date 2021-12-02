import { log, path, React, ReactDOMServer, Router, send } from "./deps.ts";
import { getArticles, getUserByEmail } from "./database/mod.ts";
import { User } from "../types.ts";
import App from "../client/App.tsx";
import { downloadFeeds } from "./feed.ts";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

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

  router.get("/user", (ctx) => {
    const user = getUserByEmail("jason@jasoncheatham.com");
    ctx.response.type = "application/json";
    ctx.response.body = user;
  });

  router.get(bundle.path, (ctx) => {
    ctx.response.type = "application/javascript";
    ctx.response.body = bundle.text;
  });

  router.get("/articles", (ctx) => {
    const params = ctx.request.url.searchParams;
    let articles: unknown[];
    if (params.has('feeds')) {
      const feedIds = JSON.parse(params.get('feeds')!);
      log.info(`getting feeds: ${JSON.stringify(feedIds)}`);
      articles = getArticles({ feedIds })
    } else {
      articles = getArticles()
    }
    ctx.response.type = "application/json";
    ctx.response.body = articles;
  });

  router.get("/update/:feed?", async (ctx) => {
    const { feed } = ctx.params;
    const feedUrls: string[] = [];
    if (feed) {
      feedUrls.push(feed);
    }

    await downloadFeeds(feedUrls);

    ctx.response.type = "application/json";
    ctx.response.body = { status: "OK" };
  });

  router.get("/", (ctx) => {
    const user = getUserByEmail("jason@jasoncheatham.com");
    ctx.response.type = "text/html";
    ctx.response.body = render(user);
  });

  return router;
}
