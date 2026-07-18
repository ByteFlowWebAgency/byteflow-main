# ByteFlow

The marketing website for **ByteFlow Solutions** — a [Next.js][nextjs] App Router
site with all content managed in [Contentful][contentful] and delivered through
the Content Delivery API.

> **Live site:** https://www.byteflow.us

## Tech stack

- **[Next.js 15][nextjs]** (App Router, React 19, Server Components)
- **TypeScript**
- **[Contentful][contentful]** headless CMS via the Content Delivery API (CDA),
  with a Preview API client for drafts
- **CSS Modules** + CSS custom properties — design tokens live in
  [`src/app/globals.css`](src/app/globals.css) (dark, glass, gradient aesthetic)
- **`next/image`** for optimized images served from Contentful's asset CDN
- **Google Fonts** — Plus Jakarta Sans (UI) and JetBrains Mono (accents)
- **[SendGrid][sendgrid]** for the contact form

## Run everything with Docker

The whole stack — this Next.js app **and** the Python site-audit microservice
(`wp-audit-service/`, which powers `/internal/site-audit`) — runs together with one
command, reusing the `.env.local` you already use for local dev:

```bash
npm run docker:up      # = docker compose --env-file .env.local up --build
```

Then open **http://localhost:3000** and sign in to `/internal`. Stop it with
`npm run docker:down`.

> **Why the `--env-file`?** Docker Compose does **not** read `.env.local` — that's a
> Next.js convention. Compose only auto-loads a file literally named `.env`, so without
> `--env-file .env.local` the build-time `CONTENTFUL_*` args arrive empty and the build
> stops with a clear error. Running plain `docker compose up` will hit that guard; use
> `npm run docker:up` (or pass `--env-file .env.local` yourself).

- **`web`** (port 3000) — the Next.js app, built to a standalone server image.
- **`audit-service`** (port 8000) — the FastAPI audit service. The web app reaches it
  in-network at `http://audit-service:8000`, so the browser never sees it or the
  `AUDIT_API_KEY`.

The `--env-file .env.local` is what makes it work: it supplies the **build-time**
Contentful credentials (`next build` renders Contentful-backed pages and fails without
them — you'll get a clear error if they're missing) **and** the runtime secrets
(`AUDIT_API_KEY`, `SUPABASE_*`, `GOOGLE_*`, …). `AUDIT_SERVICE_URL` is set by the compose
file itself, so its `.env.local` value (`http://localhost:8000`) is ignored in Docker.
Prefer a dedicated file? Copy `.env.docker.example` → `.env.docker`, fill it in, and use
`--env-file .env.docker` instead. Files: [`Dockerfile`](Dockerfile),
[`docker-compose.yml`](docker-compose.yml), [`wp-audit-service/Dockerfile`](wp-audit-service/Dockerfile).

## Getting started

### Prerequisites

- Node.js **20+** (Next.js 15 requires 18.18+)
- A Contentful space with the content models this site expects (see
  [Content model](#content-model))

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```sh
# Contentful — required
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_content_delivery_token

# Contact form (SendGrid) — required for /contact submissions
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=hello@byteflow.us
SENDGRID_TEMPLATE_ID=your_dynamic_template_id

# Contact form — optional (mirrors submissions to a Google Sheet)
GOOGLE_SHEET_WEBHOOK_URL=

# Type generation only (see `npm run generate:types`)
CONTENTFUL_PERSONAL_ACCESS_TOKEN=your_cma_personal_access_token
```

### 3. Run the dev server

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                    | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`             | Start the local dev server                                               |
| `npm run build`           | Production build                                                         |
| `npm run start`           | Serve the production build                                              |
| `npm run lint`            | Run ESLint (`eslint-config-next`)                                        |
| `npm run format`          | Format the codebase with Prettier                                       |
| `npm run generate:types`  | Regenerate Contentful content-model types into `src/lib/contentful/types` |

## Project structure

```
src/
├── app/                     # App Router routes
│   ├── layout.tsx           # Root layout — fetches header/footer from Contentful
│   ├── page.tsx             # Home
│   ├── about/               # About
│   ├── services/            # Services
│   ├── work/                # Work / portfolio
│   ├── contact/             # Contact (form posts to the API route below)
│   ├── api/contact/         # SendGrid contact-form handler
│   └── globals.css          # Design tokens + base styles
├── components/              # Presentational components (Nav, Footer, Hero,
│   │                        #   Services, Why, CtaBand, ScrollReveal) — each
│   │                        #   paired with a *.module.css file
└── lib/contentful/
    ├── client.ts            # CDA / Preview client (cached)
    ├── queries.ts           # Typed content queries (getPage, getHeader, …)
    ├── extract.ts           # Unwrap nested entries → loose CMS field shapes
    ├── props.ts             # Plain, serializable prop shapes + transforms
    └── types/               # Generated content-model types
```

## How content works

Content flows from Contentful to the UI through a small boundary layer so the
presentational components never need to know the Contentful entry shape:

1. **Fetch** — server components call helpers in
   [`queries.ts`](src/lib/contentful/queries.ts) (e.g. `getPage('/')`), which
   request entries with links resolved.
2. **Unwrap** — [`extract.ts`](src/lib/contentful/extract.ts) flattens the deeply
   nested `entry.fields.…` structure into loose, typed field shapes.
3. **Normalize** — [`props.ts`](src/lib/contentful/props.ts) maps those fields into
   clean, serializable props (and normalizes URLs, image assets, etc.).
4. **Render** — components in [`src/components/`](src/components) receive plain
   props and render the page.

When the content models change in Contentful, run `npm run generate:types` to
refresh the typed definitions in `src/lib/contentful/types`.

## Content model

| Content type             | Role                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| `page`                   | A page composed of ordered `section`s                             |
| `section`                | A `header` (hero/sectionHeader) plus a list of `cards`            |
| `hero` / `sectionHeader` | Section header: eyebrow, heading, sub-text, CTAs                  |
| `featureCard` / `caseStudy` | Card content (titles, descriptions, thumbnails, links)         |
| `header` / `footer`      | Global navigation, logo, and footer columns                       |
| `navLink`                | A label + URL used in nav and CTAs                                |
| `seo`                    | Per-page metadata                                                 |

## Deployment

Deploy to any Next.js-compatible host (e.g. Vercel). Set the same environment
variables from [step 2](#2-configure-environment-variables) in your hosting
provider, then build with `npm run build`.

## License

MIT — see [`package.json`](package.json).

[nextjs]: https://nextjs.org/
[contentful]: https://www.contentful.com/
[sendgrid]: https://sendgrid.com/
