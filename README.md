# Simple News

A very simple RSS news aggregator and reader written with Rust and Svelte.

## Development

Start the server in `server/` with

```sh
$ cargo dev
```

Start the client in `client/` with

```sh
$ pnpm install
$ pnpm dev
```

## Deployment

Build a docker image with `./dev build`. Push to a container report, then run
that on the target server.
