# Angular Beginner Machine Test

An Angular 21 admin console built for the machine test brief: authentication, role based
access, user management, multiple image upload with a product-style magnifier, a Google
Drive-like file manager, and server-side search / filter / pagination against a mock REST API.

- **Frontend:** Angular 21 (standalone components, signals, new control flow), TypeScript, RxJS
- **Mock API:** [json-server](https://github.com/typicode/json-server) over `db.json`
- **UI:** custom CSS design system + Angular Material paginator & snackbar + Lucide icons

---

## 1. Setup

```bash
npm install
```

Two processes need to run side by side.

```bash
# Terminal 1 - mock REST API on http://localhost:3000
npm run api

# Terminal 2 - Angular dev server on http://localhost:4200
npm start
```

Then open <http://localhost:4200>. The API base URL lives in
[`src/environments/environment.ts`](src/environments/environment.ts) if port 3000 is taken.

Other commands:

| Command | What it does |
| --- | --- |
| `npm start` | Dev server with live reload |
| `npm run api` | json-server watching `db.json` on port 3000 |
| `npm run build` | Production build into `dist/` |
| `npm test` | Unit tests (Vitest, 22 tests) |

## 2. Demo accounts

Each account demonstrates a different permission level. The login screen lists them and fills
the form for you.

| Role | Email | Password | Can do |
| --- | --- | --- | --- |
| Administrator | `admin@demo.com` | `Admin@123` | Everything, including add/edit/delete users |
| Manager | `manager@demo.com` | `Manager@123` | View users (read-only), manage images and files |
| Viewer | `viewer@demo.com` | `Viewer@123` | Read-only everywhere; user management is blocked |

Signing in as the viewer and opening <http://localhost:4200/users> shows the unauthorized page —
that is the role guard doing its job.

## 3. API details

`json-server` serves `db.json` as a plain REST API. No custom server code is used, so everything
that is not plain CRUD is handled in the Angular layer (see the notes below the table).

| Method & path | Used for |
| --- | --- |
| `GET /users?email=&password=` | Login lookup |
| `GET /users?_page=&_limit=&q=&role=&status=&_sort=&_order=` | User list (paging, search, filters, sorting) |
| `POST /users` · `PATCH /users/:id` · `DELETE /users/:id` | Create / update / delete a user |
| `GET /images?_sort=uploadedAt&_order=desc` | Gallery listing |
| `POST /images` · `DELETE /images/:id` | Upload / delete an image |
| `GET /nodes?parentId=` · `GET /nodes?name_like=` | Folder contents / search across the tree |
| `POST /nodes` · `PATCH /nodes/:id` · `DELETE /nodes/:id` | Create folder, upload file, rename, delete |

Collections in `db.json`: `users` (40 records), `images`, `nodes` (folders and files).

**Things worth knowing about the mock API**

- **Server-side pagination.** json-server returns the page in the body and the row count in the
  `X-Total-Count` header, which is what drives the paginator.
- **Login.** json-server has no auth endpoint, so `AuthService` matches the credentials against
  the `users` collection and mints the session token itself. The token is a base64 JWT-shaped
  payload with an expiry — enough to exercise the interceptor, guards and session expiry, but it
  is **not** a real signed token and passwords live in plain text in `db.json`. That is fine for a
  mock, and would obviously be a real login endpoint in production.
- **Uploads.** json-server only stores JSON, so files are read in the browser with `FileReader`
  and saved as base64 data URLs on the record. Uploads are capped at 2 MB each
  (`environment.maxUploadMb`) to keep `db.json` reasonable.
- **Root folder.** json-server cannot filter on `null`, so top-level items use `parentId: "root"`.
- **Recursive delete.** Deleting a folder deletes its whole subtree, sequentially, from the
  Angular service.

## 4. Implemented features

**Authentication** — login form with validation, session token in `localStorage`, expiry checked
on every request, logout, and clear messages for wrong credentials or a deactivated account.

**Authorization** — three roles. `authGuard` protects every page and remembers where you were
going (`?redirectTo=`); `guestGuard` keeps signed-in users off the login page; `roleGuard` reads
`data.roles` and sends anyone else to a "no access" page. Actions the current role cannot perform
are hidden, and each page explains why.

**User management** — table with debounced search, role and status filters, sortable columns,
server-side pagination, and Add / View / Edit / Delete. The form validates required fields, email
format and phone pattern, and checks the API for duplicate emails with an async validator.

**Multiple image upload** — drag-and-drop or file picker, previews before upload, per-file type
and size validation, and a per-file status (ready / uploading / uploaded / failed) so a partial
failure is visible. Files upload one at a time and object URLs are released afterwards.

**Gallery & magnifier** — responsive thumbnail grid, click to select, and a product-page style
zoom: a lens follows the pointer and the magnified region is painted in a pane beside the image
(below it on narrow screens). Touch devices pan the same lens.

**Files & folders** — folders and subfolders, breadcrumb navigation, file upload into the current
folder, view (inline preview or download), rename, and recursive delete. Search looks across every
folder.

**Reusable components** — `shared/` holds the pieces every page reuses: `app-table-data` (generic
table with sorting, loading, empty state and custom column templates via `appColumnTemplate`),
`app-ui-button`, `app-modal`, `app-confirm-dialog`, `app-pagination`, `app-search-input`,
`app-file-drop-zone`, `app-image-magnifier`, `app-loader`, `app-empty-state`, `app-badge`,
`app-page-header` and a `fileSize` pipe.

**Errors & loading** — an HTTP interceptor shows a snackbar for expired sessions, unreachable API
and server faults; pages show contextual messages with a retry action for everything else. Every
list has a loading state and an empty state, and every button that starts a request disables
itself while it runs, which prevents duplicate submissions.

**Responsive UI** — three breakpoints. The sidebar becomes a drawer below 900px, tables collapse
into one card per row below 760px, and dialogs become bottom sheets on phones.

## 5. Project structure

```
src/app/
├── core/                 # things with no UI
│   ├── guards/           # authGuard, guestGuard, roleGuard
│   ├── interceptors/     # auth (token), loading (progress bar), error (401 / network / 5xx)
│   ├── models/           # User, Session, GalleryImage, DriveNode, PagedResult
│   ├── services/         # Auth, User, Gallery, Drive, Notification, Loading
│   └── utils/            # file validation + reading, HTTP error messages
├── layout/app-shell/     # header, navigation, progress bar, router outlet
├── pages/                # login, home-page (dashboard), users, gallery, drive, no-access, not-found
└── shared/               # reusable components, directives and pipes
```

Routes are lazy loaded with `loadComponent`, and every page is a standalone component.

## 6. Tests

```bash
npm test
```

22 unit tests cover the auth service (login, invalid credentials, deactivated accounts, role
checks, session restore and expiry), the auth guard, the generic table component (rendering,
custom column templates, sorting, empty and loading states), the file size pipe, the dashboard
and the root component.

## 7. Known limitations

- The mock API accepts any request; role rules are enforced in the Angular layer only. A real
  backend must enforce them again server-side.
- Uploaded files are stored inline in `db.json`, so it grows with every upload. Delete a few
  records, or re-seed, if it gets large.
- `db.json` is the database — running `npm run api` twice from the same folder, or editing the
  file by hand while it runs, can cause json-server to reload mid-write.
