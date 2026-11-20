# Project Plan

The work is split into eight stages. Each stage is one branch and one pull request into
`main`, reviewed by the other partner before merging. Each stage follows TDD: write the
failing tests first, implement until they pass, then refactor.

Owners for stages 2–8 are a proposal; Shalev and Yair can change them.

| # | Stage | Branch | Owner | Depends on |
| - | ----- | ------ | ----- | ---------- |
| 1 | Project setup | `feature/project-setup` | Shalev | — |
| 2 | Users and JWT authentication | `feature/02-auth` | Yair (proposed) | 1 |
| 3 | Movies CRUD | `feature/03-movies` | Shalev (proposed) | 2 |
| 4 | Movie search, filtering, pagination | `feature/04-movie-search` | Yair (proposed) | 3 |
| 5 | Reviews CRUD | `feature/05-reviews` | Shalev (proposed) | 3 |
| 6 | Movie statistics | `feature/06-statistics` | Yair (proposed) | 4, 5 |
| 7 | Swagger / OpenAPI documentation | `feature/07-swagger` | Shalev (proposed) | 2–6 |
| 8 | Test hardening, final docs, submission | `feature/08-finalize` | Both | 1–7 |

Stages 4 and 5 both depend only on stage 3, so they can be developed in parallel.

```
1 ─▶ 2 ─▶ 3 ─┬─▶ 4 ─┐
             └─▶ 5 ─┴─▶ 6 ─▶ 7 ─▶ 8
```

## Stage details

### 1. Project setup
- package.json and scripts, TypeScript strict mode, Jest + Supertest
- `app.ts` / `server.ts` split, Mongoose connection, environment validation
- Standard error format, 404 handler, global error handler
- `GET /health` (TDD)
- README, `docs/architecture.md` (API contracts), this plan

### 2. Users and JWT authentication
- `User` model, bcrypt password hashing
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `authenticate` middleware (Bearer token) and `requireRole` / ownership helpers
- Request validation middleware (shared by all later stages)
- In-memory MongoDB test helper (`mongodb-memory-server`) for integration and API tests
- Tests: hashing and token utilities (unit), auth service (integration), all endpoints including 401/409 cases (API)

### 3. Movies CRUD
- `Movie` model with validation and indexes
- `POST`, `GET /:id`, `PATCH`, `DELETE /api/movies` and a basic `GET /api/movies` list
- Ownership rule: creator or admin can update/delete
- ObjectId validation (`INVALID_ID`)
- Tests: validation, ownership (403), not found (404)

### 4. Movie search, filtering, pagination
- `q`, `genre`, `year`, `director`, `actor`, `sort`, `page`, `limit` on `GET /api/movies`
- Text index, query validation, pagination envelope
- Tests: each filter, combined filters, invalid query parameters, pagination boundaries

### 5. Reviews CRUD
- `Review` model, unique `(movie, user)` index
- Nested `GET/POST /api/movies/:movieId/reviews`; `GET/PATCH/DELETE /api/reviews/:reviewId`
- Author-or-admin rule; cascade delete of reviews when a movie is deleted
- Tests: rating bounds, duplicate review (409), ownership, cascade

### 6. Movie statistics
- Aggregation computing `reviewCount` and `averageRating` (rounded, `null` when no reviews)
- `stats` on movie details and on each movie in list responses; sort by `averageRating`
- Tests: zero reviews, rounding, stats change after review create/update/delete

### 7. Swagger / OpenAPI documentation
- OpenAPI 3 spec covering every endpoint, schema, error response and the Bearer auth scheme
- Swagger UI at `/api-docs`
- Test that the spec loads and that every implemented route is documented

### 8. Test hardening, final docs, submission
- Fill coverage gaps, edge cases, consistent test data factories
- Optional GitHub Actions workflow running build and tests
- Final README (setup, decisions), seed script with sample data and an admin user
- Submission document (names and IDs), demo video of the test run and Swagger UI
