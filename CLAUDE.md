# Card Factory — Claude Code Project Notes

## Project Overview

Card Factory is a Trello Power-Up built with React 17, TypeScript, and Webpack 5,
deployed to Cloudflare Pages.

## Key Constraints

- **React 17** (not 18). No concurrent features, no `useId()`, no automatic batching outside events.
- **Trello client library** loaded via script tag, accessed through `window.TrelloPowerUp`.
- **No test framework** currently configured.

## Development Workflow

1. Copy `.env.example` to `.env` and fill in your Trello Power-Up app key.
2. `yarn install`
3. `yarn build:dev` (webpack watch mode)
4. In a separate terminal: `yarn start:dev`
5. Run `cloudflared tunnel --url http://localhost:3000` to get a public URL.
6. Set that URL as the iframe connector URL in Trello Power-Up admin.
7. Add the Power-Up to a board and test.

## File Layout

```
src/
  capabilities.ts       — Power-Up capability registration (entry point)
  addon.tsx             — React entry point
  router.tsx            — React Router setup
  connector/
    Connector.tsx       — Hello world connector page
  server.ts             — Static file server for production
  dev-server.ts         — Dev server (loads .env then runs server)
  types/
    trello.d.ts         — Trello Power-Up API type definitions
templates/              — Handlebars templates for HTML pages
static/                 — Icons and favicon
webpack.config.ts       — Build config
```

## Deployment

GitHub Actions builds and deploys to Cloudflare Pages on push to main.
Requires GitHub secrets: `POWERUP_APP_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
