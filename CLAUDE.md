# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

An Angular 21 admin console built as a beginner machine test: authentication, role based access,
user management, multiple image upload with a magnifier, a Drive-style file manager, and
server-side search / filter / pagination. `README.md` documents the features for a reviewer; this
file covers how to work in the code.

## Commands

```bash
npm start          # dev server on http://localhost:4200
npm run api        # json-server mock API on http://localhost:3000 (must run alongside npm start)
npm run build      # production build (budgets: 700 kB initial warning, 4 kB per component stylesheet)
npm test           # Vitest unit tests, single run via ng test --watch=false
```

The app is useless without `npm run api` — every page loads its data from json-server.

## Architecture

```
src/app/
├── core/          # no UI: guards, interceptors, models, services, utils
├── layout/        # app-shell (header, nav, progress bar, outlet) for signed-in routes
├── pages/         # one folder per route, lazy loaded with loadComponent
└── shared/        # reusable components, directives, pipes
```

- Routes live in `app.routes.ts`. Protected pages are children of the `AppShell` route behind
  `authGuard`; role restricted pages add `roleGuard` plus `data: { roles: [...] }`.
- HTTP is wired in `app.config.ts` with three functional interceptors, in order: `authInterceptor`
  (attaches the bearer token), `loadingInterceptor` (global progress bar), `errorInterceptor`.
- `errorInterceptor` only handles what a page cannot: 401 (sign out), status 0 and 5xx (snackbar).
  Everything else is rethrown so the calling page can show it in context via `toFriendlyMessage()`.

## Conventions

- **Standalone components only**, no NgModules. Class names have no suffix and match the folder
  name (`pages/home-page/home-page.ts` → `HomePage`). Services keep the `Service` suffix.
- **Signals for state**, `input()` / `output()` / `computed()` / `linkedSignal()` over decorators.
  The app is zoneless, so async results must land in a signal to update the view.
- **RxJS at the edges**: services return observables; pages subscribe and store the result in a
  signal. Lists that reload on user input push through a `Subject` + `switchMap` so a stale
  response cannot overwrite a newer one.
- **Templates** use the built-in control flow (`@if`, `@for`, `@switch`), never `*ngIf` / `*ngFor`.
- **Styling** is plain CSS. Shared tokens, form, badge and alert classes live in `src/styles.css`;
  component styles stay local and small. Angular Material is used for the paginator and snackbar
  only — do not reach for Material for anything else. Icons come from `@lucide/angular` as
  `<svg lucideName size="16"></svg>`, imported per component.
- **Reuse before writing UI**: check `shared/components` first (`app-table-data`, `app-ui-button`,
  `app-modal`, `app-confirm-dialog`, `app-pagination`, `app-search-input`, `app-file-drop-zone`,
  `app-image-magnifier`, `app-loader`, `app-empty-state`, `app-badge`, `app-page-header`).
- Every button that starts a request takes `[loading]`, which disables it and prevents duplicate
  submissions. Keep that pattern.

## Working with the mock API

`db.json` is the database; json-server rewrites it on every write. Notes that bite if forgotten:

- json-server cannot filter on `null`, so root level drive items use `parentId: "root"`
  (`DRIVE_ROOT`).
- List responses carry the row count in the `X-Total-Count` header; `UserService.list()` reads it
  with `observe: 'response'`.
- There is no auth endpoint. `AuthService` matches credentials against the `users` collection and
  mints its own base64 token with an expiry. Passwords sit in plain text in `db.json`; never
  present this as production auth.
- Uploads are stored as base64 data URLs on the record (2 MB cap, `environment.maxUploadMb`), so
  `db.json` grows with every upload.
- Role rules are enforced in the Angular layer only — the mock API accepts anything.
- Do not add a custom Node/Express server. The mock API must stay plain `json-server` over
  `db.json`.

## Tests

Vitest with `@angular/build:unit-test`, jsdom, TestBed. Specs sit next to the code they cover.
Use `provideHttpClientTesting()` for anything that touches HTTP, and a stub object for
`AuthService` when a component only reads `currentUser()` / `hasRole()`. Component tests that need
inputs or content projection use a small host component (see `table-data.spec.ts`).
