# Architecture and API Contracts

This document is the shared contract for all development stages. Later stages implement
it; any change to a contract should be made here first, in the same pull request.

## 1. Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Runtime        | Node.js (>= 20), TypeScript strict mode  |
| HTTP framework | Express 5                                |
| Database       | MongoDB via Mongoose                     |
| Auth           | JWT (Bearer tokens), bcrypt password hashes |
| Docs           | Swagger UI / OpenAPI 3, served at `/api-docs` |
| Tests          | Jest + Supertest; in-memory MongoDB for integration tests |

## 2. Project structure

```
src/
  app.ts            Builds the Express app (no listen, no DB) — used by tests
  server.ts         Entry point: load config, connect DB, listen, graceful shutdown
  config/           Environment validation (env.ts) and DB connection (database.ts)
  models/           Mongoose schemas and models
  routes/           URL → middleware → controller wiring, one router per resource
  controllers/      HTTP layer: read the request, call a service, send the response
  services/         Business logic and database access
  middleware/       Auth, validation, 404 and global error handling
  validators/       Request schemas (body, params, query)
  types/            Shared TypeScript types
  utils/            Small helpers (e.g. AppError)
tests/
  setup/            Jest setup (test environment variables, DB helpers)
  unit/             Pure functions and services in isolation
  integration/      Services + models against an in-memory MongoDB
  api/              Full HTTP requests through the app with Supertest
docs/               Architecture, project plan
```

### Layering rules

- **Routes** only wire middleware and controllers. No logic.
- **Controllers** translate HTTP ↔ service calls. They do not query models directly.
- **Services** hold all business rules (ownership checks, statistics, uniqueness) and
  throw `AppError` for expected failures. They do not know about `req`/`res`.
- **Models** define schema-level constraints and indexes.
- `createApp()` never connects to the database, so API tests control the DB themselves.

## 3. Domain model

**User** — `username` (unique, 3–30 chars), `email` (unique, lowercase), `passwordHash`
(never returned), `role` (`user` | `admin`, default `user`), timestamps.

**Movie** — `title` (required), `releaseYear` (integer, 1888 – current year + 5), `genres`
(non-empty array of strings), `director` (required), `actors` (array of strings),
`description` (optional, max 2000 chars), `createdBy` (User id), timestamps.
Text index on `title`, `director`, `actors`, `description` for search.

**Review** — `movie` (Movie id), `user` (User id), `rating` (integer 1–10), `text`
(required, 1–2000 chars), timestamps. Unique index on `(movie, user)`: one review per
user per movie.

**Statistics** are not stored. `reviewCount` and `averageRating` are computed with a
MongoDB aggregation on `reviews`, so they can never drift from the actual data.

## 4. Endpoints

`Auth` column: — public, 🔒 valid JWT required.

### Health

| Method | Path      | Auth | Description |
| ------ | --------- | ---- | ----------- |
| GET    | `/health` | —    | Liveness: `{ status: "ok", database, uptime, timestamp }`. Always 200 while the process runs; `database` reports the Mongoose connection state. |

### Authentication

| Method | Path                 | Auth | Success | Description |
| ------ | -------------------- | ---- | ------- | ----------- |
| POST   | `/api/auth/register` | —    | 201     | Body `{ username, email, password }`. Returns `{ user, token }`. Always creates role `user`. |
| POST   | `/api/auth/login`    | —    | 200     | Body `{ email, password }`. Returns `{ user, token }`. Wrong email and wrong password give the same 401. |
| GET    | `/api/auth/me`       | 🔒   | 200     | Returns the current user. |

Tokens are sent as `Authorization: Bearer <token>`. Payload: `{ sub: userId, role }`,
expiry from `JWT_EXPIRES_IN`. Passwords: min 8 characters, hashed with bcrypt.

### Movies

| Method | Path              | Auth | Success | Description |
| ------ | ----------------- | ---- | ------- | ----------- |
| GET    | `/api/movies`     | —    | 200     | List/search (see query parameters). Each item includes `stats`. |
| POST   | `/api/movies`     | 🔒   | 201     | Create. `createdBy` is set from the token. |
| GET    | `/api/movies/:id` | —    | 200     | Movie details including `stats`. |
| PATCH  | `/api/movies/:id` | 🔒   | 200     | Partial update. Creator or admin only. |
| DELETE | `/api/movies/:id` | 🔒   | 204     | Delete the movie **and its reviews**. Creator or admin only. |

Search query parameters for `GET /api/movies`:

| Param      | Meaning |
| ---------- | ------- |
| `q`        | Free-text search over title, director, actors, description |
| `genre`    | Exact genre match (case-insensitive) |
| `year`     | Exact release year |
| `director` | Partial, case-insensitive match |
| `actor`    | Partial, case-insensitive match on any actor |
| `sort`     | `title`, `releaseYear`, `averageRating`, `createdAt`; prefix `-` for descending. Default `-createdAt` |
| `page`     | 1-based, default 1 |
| `limit`    | 1–100, default 20 |

### Reviews

| Method | Path                           | Auth | Success | Description |
| ------ | ------------------------------ | ---- | ------- | ----------- |
| GET    | `/api/movies/:movieId/reviews` | —    | 200     | Paginated reviews of a movie, newest first. 404 if the movie does not exist. |
| POST   | `/api/movies/:movieId/reviews` | 🔒   | 201     | Body `{ rating, text }`. 409 if this user already reviewed this movie. |
| GET    | `/api/reviews/:reviewId`       | —    | 200     | Single review. |
| PATCH  | `/api/reviews/:reviewId`       | 🔒   | 200     | Update `rating` and/or `text`. Author or admin only. |
| DELETE | `/api/reviews/:reviewId`       | 🔒   | 204     | Author or admin only. |

## 5. Authorization rules

| Action                         | Anonymous | User                 | Admin |
| ------------------------------ | --------- | -------------------- | ----- |
| Read movies, reviews, stats    | ✅        | ✅                   | ✅    |
| Create movie                   | ❌ 401    | ✅                   | ✅    |
| Update / delete movie          | ❌ 401    | own movies only (403) | ✅    |
| Create review                  | ❌ 401    | ✅ (one per movie)   | ✅    |
| Update / delete review         | ❌ 401    | own reviews only (403) | ✅    |

Admins are not created through the API; they are promoted directly in the database or
through a seed script, so nobody can register as an admin.

## 6. Response formats

All bodies are JSON. Documents are returned with `id` (string) instead of `_id`, without
`__v`, and with ISO-8601 `createdAt` / `updatedAt`. `passwordHash` is never returned.

**Single resource** — the object itself:

```json
{
  "id": "665f1c2e9b1e8a0012345678",
  "title": "Inception",
  "releaseYear": 2010,
  "genres": ["Sci-Fi", "Thriller"],
  "director": "Christopher Nolan",
  "actors": ["Leonardo DiCaprio", "Elliot Page"],
  "description": "A thief who steals corporate secrets through dream-sharing...",
  "createdBy": "665f1b009b1e8a0012340000",
  "stats": { "reviewCount": 2, "averageRating": 8.5 },
  "createdAt": "2026-11-20T10:00:00.000Z",
  "updatedAt": "2026-11-20T10:00:00.000Z"
}
```

`averageRating` is rounded to one decimal place and is `null` when `reviewCount` is 0.

**Collections** — data plus pagination:

```json
{
  "data": [ { "...": "..." } ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

**Delete** — `204 No Content` with an empty body.

## 7. Error format

Every error has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "releaseYear", "message": "Must be an integer" }]
  }
}
```

`details` is present only for validation errors.

| Status | `code`             | When |
| ------ | ------------------ | ---- |
| 400    | `VALIDATION_ERROR` | Body, params or query failed validation |
| 400    | `INVALID_ID`       | A path id is not a valid ObjectId |
| 400    | `INVALID_JSON`     | Body is not valid JSON |
| 401    | `UNAUTHORIZED`     | Missing, malformed, expired or invalid token; bad login |
| 403    | `FORBIDDEN`        | Authenticated but not the owner / not an admin |
| 404    | `NOT_FOUND`        | Resource or route does not exist |
| 409    | `CONFLICT`         | Duplicate email/username, second review of the same movie |
| 500    | `INTERNAL_ERROR`   | Unexpected error; details are logged, never sent to the client |

Expected errors are thrown as `AppError` and converted by the global error handler
(`src/middleware/errorHandler.ts`).

## 8. Configuration

Validated at startup by `src/config/env.ts`; the server refuses to start with a list of
every problem if anything is invalid. See `.env.example`.

| Variable         | Required | Default       | Notes |
| ---------------- | -------- | ------------- | ----- |
| `NODE_ENV`       | no       | `development` | `development`, `test`, `production` |
| `PORT`           | no       | `3000`        | 1–65535 |
| `MONGODB_URI`    | yes      | —             | |
| `JWT_SECRET`     | yes      | —             | ≥ 32 characters in production |
| `JWT_EXPIRES_IN` | no       | `1h`          | Any `jsonwebtoken` duration |

## 9. Engineering decisions

- **Express 5** — native async error propagation, so controllers need no try/catch wrappers.
- **`app.ts` / `server.ts` split** — tests import the app without opening ports or DB connections.
- **Computed statistics** instead of counters stored on the movie: always consistent, and
  fast enough for this scale with an index on `reviews.movie`.
- **One review per user per movie** — enforced by a unique index, not only in code.
- **Cascade delete** of reviews when a movie is deleted, so no orphan reviews exist.
- **PATCH, not PUT** — clients send only the fields they change.
- **Liveness `/health` outside `/api`** — conventional location for monitoring; it always
  returns 200 while the process is up and reports DB state as data.
