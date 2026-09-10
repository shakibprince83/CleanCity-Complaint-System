# CleanCity Complaint System UI

Interactive frontend prototype for Team Void's waste collection complaint system. The project implements the complete citizen and administrator UI in React, JavaScript and handcrafted CSS, with no Tailwind dependency.

## Current milestone

- 19 individually accessible presentation screens
- Responsive dark-green civic theme with glass surfaces and hover states
- Mock data and UI-only demo mode; no backend is required for the presentation
- Password confirmation, NID verification state and optional volunteer registration
- Waste, ordinary waterlogging and verified emergency complaint flows
- Leaflet map with OpenStreetMap tiles, draggable pin, current location and 5 km service boundary
- Complaint search, filtering, timeline and unique-ID confirmation
- Admin assignment, status and priority controls
- Validity review and protected trust-point degradation confirmation

## Run locally

```bash
pnpm install
pnpm dev
```

Open the app and use `#/preview` to access every screen independently.

## Presentation links

| Area | Hash route |
| --- | --- |
| UI directory | `#/preview` |
| Home | `#/home` |
| Registration | `#/register` |
| Login | `#/login` |
| Citizen dashboard | `#/citizen-dashboard` |
| Submit complaint | `#/submit-complaint` |
| Location selection | `#/location` |
| Submission confirmation | `#/submission-confirmation` |
| My complaints | `#/my-complaints` |
| Complaint details | `#/complaint-details` |
| Profile | `#/profile` |
| Notifications | `#/notifications` |
| Admin dashboard | `#/admin-dashboard` |
| Manage complaints | `#/manage-complaints` |
| Edit complaint | `#/edit-complaint` |
| User management | `#/user-management` |
| Edit user | `#/edit-user` |
| Report to authority | `#/report-authority` |
| Validity review | `#/validity-review` |
| Point degradation | `#/point-degradation` |

## Planned backend phase

The UI is structured so mock data can later be replaced with a Node.js and Express API backed by MySQL (`mysql2`). Keep authentication, role access, complaint workflows, attachment storage, notifications and audit logs in the server layer. Leaflet remains in the frontend.

## Build

```bash
pnpm build
pnpm preview
```

The production output is created in `dist/`.
