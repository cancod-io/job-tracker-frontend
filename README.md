# Frontend — TrackCod User App

Next.js 15 (App Router) · TypeScript · Tailwind · TanStack Query.

User app for sign-in, email verification, profile (avatar, CVs), and the encrypted credentials vault.

---

## Layout (summary)

```
src/
├── app/
│   ├── (auth)/          # login, register, verify-email
│   ├── (shell)/         # profile, credentials, about
│   └── upstream-api/    # catch-all proxy → API_INTERNAL_URL
├── components/
├── lib/
│   ├── api.ts           # apiUrl() remaps /api/v1 → /upstream-api in the browser
│   └── upstream-proxy.ts
├── providers/
└── types/
```

---

## Local development

```bash
npm install
cp .env.local.example .env.local
npm run dev      # → http://localhost:3000
```

Point `API_INTERNAL_URL` at the FastAPI backend (`http://localhost:8000` locally, or your FastAPI Cloud URL).

---

## Environment

| Variable | Purpose |
|----------|---------|
| `API_INTERNAL_URL` | Server-side upstream for `/upstream-api/*` (required on Vercel) |
| `NEXT_PUBLIC_API_URL` | Optional public hint for error/timeout messages |

Browser traffic stays same-origin via `/upstream-api/*`. Do not call the Python API directly from the browser.

---

## Common commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run check` | lint + type-check + format check |

---

## Vercel

1. Import this directory as a Vercel project.
2. Set `API_INTERNAL_URL` (and optionally `NEXT_PUBLIC_API_URL`) to the FastAPI Cloud base URL.
3. Add the Vercel origin to the API `CORS_ORIGINS` and set `FRONTEND_URL` to the user app URL.
