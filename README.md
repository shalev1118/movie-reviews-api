# Movie Reviews API

Backend REST API for a movie reviews system, built for Assignment 1 of the Web Systems
Development course. Users can manage movies and reviews, and each movie shows its review
count and average rating. Authentication uses JWT.

**Team:** Shalev, Yair

> Status: Stage 1 of 8 (project foundation). Only `GET /health` is implemented so far.
> See [docs/project-plan.md](docs/project-plan.md) for the roadmap.

## Tech stack

Node.js · Express 5 · TypeScript (strict) · MongoDB · Mongoose · JWT · Swagger/OpenAPI · Jest · Supertest

## Getting started

Prerequisites: Node.js 20 or newer, and a MongoDB instance (local or MongoDB Atlas).

```bash
npm install
cp .env.example .env        # then edit MONGODB_URI and JWT_SECRET
npm run dev                 # start with auto-reload
```

Check that it runs:

```bash
curl http://localhost:3000/health
```

## Scripts

| Script                  | Description |
| ----------------------- | ----------- |
| `npm run dev`           | Start in development mode with auto-reload (tsx) |
| `npm run build`         | Compile TypeScript to `dist/` |
| `npm start`             | Run the compiled server |
| `npm test`              | Run all tests |
| `npm run test:watch`    | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run typecheck`     | Type-check source and tests without emitting |

## Environment variables

| Variable         | Required | Default       | Description |
| ---------------- | -------- | ------------- | ----------- |
| `NODE_ENV`       | no       | `development` | `development`, `test` or `production` |
| `PORT`           | no       | `3000`        | HTTP port |
| `MONGODB_URI`    | yes      | —             | MongoDB connection string |
| `JWT_SECRET`     | yes      | —             | Secret for signing tokens (at least 32 characters in production) |
| `JWT_EXPIRES_IN` | no       | `1h`          | Token lifetime |

The server checks these at startup and exits with a clear message if any are invalid.

## Project structure

```
src/
  app.ts          Express app factory (used by tests)
  server.ts       Entry point
  config/         Environment and database configuration
  controllers/    HTTP request/response handling
  services/       Business logic
  routes/         Route definitions
  middleware/     Error handling, auth, validation
  models/         Mongoose models
  validators/     Request validation schemas
  types/          Shared types
  utils/          Helpers
tests/
  unit/           Isolated unit tests
  integration/    Tests against an in-memory MongoDB
  api/            HTTP tests with Supertest
docs/
  architecture.md API contracts, authorization rules, error format, design decisions
  project-plan.md Development stages
```

## Documentation

- [Architecture and API contracts](docs/architecture.md)
- [Project plan](docs/project-plan.md)
- Swagger UI will be available at `/api-docs` (stage 7)
