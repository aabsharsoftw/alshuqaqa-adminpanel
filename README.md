# Rental Admin

Admin portal for `rental-app-backend`. React 19 + TypeScript + Vite, no UI framework.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_URL at the backend
npm run dev            # http://localhost:5173
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000` | Backend base URL |
| `VITE_CURRENCY` | `SAR` | Label shown beside rent amounts |

The backend must allow this origin — set `CORS_ORIGIN` there to
`http://localhost:5173` (or whatever the portal is served from).

Sign in with the admin account seeded from the backend's `ADMIN_EMAIL` /
`ADMIN_PASSWORD`. Non-admin accounts are rejected at login.

## Backend endpoints used

| Screen | Method & path |
| --- | --- |
| Login / session | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Listings | `GET /admin/listings?status&page&limit` |
| Approve listing | `PATCH /admin/listings/:id/approve` |
| Reject listing | `PATCH /admin/listings/:id/reject` (body `{ reason? }`) |
| Delete listing | `DELETE /listings/:id` |
| Landlords | `GET /admin/landlords` |
| Trust landlord | `PATCH /admin/landlords/:id/approve` |
| Enquiries | `GET /admin/enquiries?page&limit` |

Every request carries `Accept-Language: en|ar`, driven by the EN/AR switch in the
top bar, so listing text comes back in the selected language.

## Screens

- **Dashboard** — counts per listing status, landlord trust backlog, enquiry
  volume, the pending-review queue and the latest enquiries.
- **Listings** — status tabs (Pending / Approved / Rejected / Drafts / All),
  paginated table, review dialog with the image gallery and both language
  variants side by side, plus approve / reject-with-reason / delete.
- **Landlords** — trust status, listing counts, one-click "mark trusted".
- **Enquiries** — paginated feed with tenant contact details and the listing
  each enquiry refers to.

The status filter and page live in the URL, so views are linkable and survive a
reload. Search boxes filter the rows already loaded — the backend has no admin
search endpoint.

## Structure

```
src/
  auth/        session context + provider
  components/  layout, modal, toasts, listing review dialog, shared UI
  lib/         API client, types, formatting, preferences, async hook
  pages/       Dashboard, Listings, Landlords, Enquiries, Login
```

The JWT is kept in `localStorage`; a `401` from any call clears it and returns
to the login screen.

## Scripts

```bash
npm run dev      # dev server
npm run build    # typecheck + production build
npm run lint     # oxlint
npm run preview  # serve the build
```
