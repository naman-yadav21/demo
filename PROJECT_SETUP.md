# Travel Desk Frontend Setup

## Project overview

This repository contains a standalone React frontend for the existing Travel Desk application. Lumenore remains the backend and database; no backend, database schema, application workflow, or live API integration has been created here.

The current screens are placeholders. Replace or refine them as application screenshots and branding references are provided.

## Technologies

- React with JavaScript (JSX)
- Vite
- Tailwind CSS v4
- React Router DOM
- Lucide React icons
- ESLint

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run the application

```sh
npm install
npm run dev
```

Vite prints the local development URL, usually `http://localhost:5173`.

Other available commands:

```sh
npm run lint       # Check JavaScript and JSX with ESLint
npm run build      # Create a production build in dist/
npm run preview    # Preview the production build locally
```

## Project structure

```text
src/
  assets/                  # Reserved for images and icons
  components/
    common/                # Shared page-level components
    layout/                # Application shell, sidebar, and top navigation
    ui/                    # Reusable buttons, fields, cards, tables, states, etc.
  constants/               # Shared application constants
  context/                 # Shared React context, including notifications
  hooks/                   # Reusable React hooks
  pages/                   # Provisional route placeholder pages
  routes/                  # Route definitions and path constants
  services/
    api/                   # Central API client
    lumenore/              # Reserved Lumenore integration module
  styles/                  # Tailwind entry point and shared component styles
  utils/                   # Small shared helpers
  App.jsx
  main.jsx
```

## Provisional routes

- `/login`
- `/welcome`
- `/dashboard`
- `/travel-requests`
- `/travel-requests/:requestId`
- `/approvals`
- `/travel-desk`
- `/finance`
- `/reports`
- `/settings`

These routes are placeholders pending review of the actual application screens.

## Lumenore API configuration

Copy `.env.example` to `.env.local` and set `VITE_LUMENORE_API_BASE_URL` when the Workflow API details are available. The frontend currently makes no API calls. Do not put credentials or secret API keys in Vite environment variables because frontend values are exposed to browsers. API endpoints, payloads, workflow IDs, and response formats should be added only after they are provided.

## Initial verification

- Dependencies installed with `npm install`.
- Production build completed with `npm run build`.
- Vite development server started and served the application at `http://127.0.0.1:5173/`.
- ESLint completed with no errors; one Fast Refresh warning remains for the toast context module.
