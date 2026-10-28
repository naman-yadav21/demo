# Travel Desk Frontend

Standalone React + Vite frontend foundation for the existing Travel Desk application. The existing Lumenore application remains the backend and data store; this repository contains no backend, database, invented workflows, or live API calls.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local URL (usually `http://localhost:5173`). To create and preview a production build, use `npm run build` and `npm run preview`. `npm run lint` runs ESLint.

## Configuration

Copy `.env.example` to `.env.local` and set `VITE_LUMENORE_API_BASE_URL` when the Workflow API details are provided. Vite variables are exposed to browser code, so this file must contain public configuration only. No endpoints or credentials are configured yet.

## Structure

`src/components` holds reusable UI and layout elements, `src/pages` contains provisional route placeholders, `src/routes` centralizes routing, and `src/services` is reserved for the API client and Lumenore integration. Page content and business workflows will be shaped from the supplied application references.
