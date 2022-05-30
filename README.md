# Simple News

A very simple RSS news aggregator and reader written with
[Remix](https://remix.run)

## Development

```sh
$ npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

1. Clone the repository to the deployment host
2. Setup the repo
   ```js
   $ npm install
   ```
3. Init/update the database
   ```sh
   $ npm run migrate
   ```
4. Build for production:
   ```sh
   $ npm run build
   ```
5. Setup the required environment variables using a systemd unit or `.envrc`:
   * `DATABASE_URL`
   * `SESSION_SECRET`
   * `PORT` (optional)
6. Start the app server
   ```
   $ npm start
   ```
