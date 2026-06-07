# Srinil Stay

A management and booking system for **Srinil Stay**, a single small homestay in
Phatthalung, Thailand, with roughly ten bookable units. Guests browse unit
availability and book stays through the customer-facing web app, while staff
manage units, availability, and bookings through the back-office app. See
[`CONTEXT.md`](CONTEXT.md) for the domain glossary.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **Node.js** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Start the PostgreSQL container:

   ```bash
   make infra-up
   ```

2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

   ```bash
   pnpm run db:push
   ```

Then, run the development server:

```bash
pnpm run dev
```

## Bootstrapping the first Staff

Back-office Staff are invite-only — there is no self-signup. To create the
**first** Staff member (who can then invite the rest from the admin app), set
both bootstrap vars in `apps/server/.env` and start the server:

```bash
BOOTSTRAP_STAFF_EMAIL=owner@example.com
BOOTSTRAP_STAFF_NAME=Owner
```

On startup the server emails that person a Staff invitation; open the link and
set a password to activate the account. It is a no-op once that email is a user,
so the vars can be left in place. Note: while the invitation is pending, each
restart rotates the token and invalidates the previously emailed link — open the
most recent email. See
[ADR 0004](docs/adr/0004-bootstrap-first-staff-via-on-boot-invitation.md).

Local development ports:

- Customer web app (Next.js): [http://localhost:3000](http://localhost:3000)
- Back-office app (React + TanStack Router): [http://localhost:4000](http://localhost:4000)
- Server API (Hono): [http://localhost:5000](http://localhost:5000)

## Production-Like Server Verification

The default development infrastructure uses `compose.yaml` directly and starts
PostgreSQL only. `compose.override.yaml` is reserved for verifying the deployed
stack shape locally; it currently builds and runs the production server image
against the Compose PostgreSQL service.

```bash
make up
```

The server is available at [http://localhost:5000](http://localhost:5000).

```bash
make down
```

The web and back-office apps are intentionally not included in this
production-like Compose setup until their deployment model is chosen.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/back-office/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@srinil-stay/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/back-office`.

## Git Hooks and Formatting

- Format and lint fix: `pnpm run check`

## Project Structure

```text
srinil-stay/
├── apps/
│   ├── web/          # Customer-facing site (Next.js, SSR)
│   ├── back-office/  # Staff operations app (React + TanStack Router)
│   └── server/       # Backend API (Hono)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── auth/        # Authentication configuration & logic
│   └── drizzle/     # Database schema & queries
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:web`: Start only the customer web app (Next.js)
- `pnpm run dev:back-office`: Start only the back-office app
- `pnpm run dev:server`: Start only the server
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run db:push`: Push schema changes to database
- `pnpm run db:generate`: Generate database client/types
- `pnpm run db:migrate`: Run database migrations
- `pnpm run db:studio`: Open database studio UI
- `make infra-up`: Start local development infrastructure
- `make infra-down`: Stop and remove local development infrastructure
- `make up`: Build and start the production-like deployed stack
- `make down`: Stop and remove the production-like deployed stack
- `pnpm run check`: Run Biome formatting and linting
