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
3. Build for production:
   ```sh
   $ npm run build
   ```
4. Init/update the database
   ```sh
   $ npm db-migrate
   ```
5. Start the app server
   ```
   $ npm start
   ```
