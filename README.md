# GharDekho

GharDekho is a production-minded Indian real-estate marketplace. The repository is organized as an npm workspace monorepo, with the Next.js web application in `apps/web` and space for the shared Fastify API and reusable packages.

## Current scope

The initial web foundation includes the brand system, responsive navigation and footer, reusable UI foundations, API client boundary, and a marketing homepage. Listing search, accounts, and dashboards will connect to the real Fastify API when those endpoints are implemented. No fake listing or authentication data is used.

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer

## Local development

```sh
cp .env.example .env.local
npm install
npm run dev
```

The site runs at `http://localhost:3000`. `NEXT_PUBLIC_API_URL` configures the future shared API client. The homepage can render without an API; API requests fail explicitly until the base URL and endpoint are available.

## Quality checks

```sh
npm run lint
npm run typecheck
npm run build
```

## Architecture

- `apps/web`: Next.js App Router, TypeScript, Tailwind CSS, shared components, SEO metadata, and API client boundary.
- `apps/api`: reserved for the separately deployed Fastify REST API.
- `packages/database`: reserved for Prisma and PostgreSQL schema/migrations.
- `packages/types`, `packages/validation`, `packages/config`: shared API contracts, Zod schemas, and tooling as the API is introduced.

Property data, authorization, and authentication belong to the API and PostgreSQL. Property media will use S3-compatible storage; credentials and private service settings must remain server-side.

## Brand assets

The supplied transparent logo is kept as `apps/web/public/brand/ghardekhologo.png` and used in the header, footer and social preview. The brand colors are defined in `apps/web/app/globals.css`.
