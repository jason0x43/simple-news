# Simple News

A very simple RSS news aggregator and reader written with
[SvelteKit](https://kit.svelte.dev)

## Development

```sh
$ pnpm dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

1. Clone the repository to the deployment host
2. Setup the repo
   ```js
   $ pnpm install
   ```
3. Init/update the database
   ```sh
   $ pnpm migrate
   ```
4. Build for production:
   ```sh
   $ pnpm build
   ```
5. Setup the required environment variables using a systemd unit or `.envrc`:
   * `DATABASE_URL`
   * `PORT` (optional)
6. Start the app server
   ```
   $ pnpm start
   ```
