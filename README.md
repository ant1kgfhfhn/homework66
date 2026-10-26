# HW65 — Passport Authentication and MongoDB CRUD API

## Description

Express application with Passport Local authentication, MongoDB Atlas storage, and a protected JSON API implementing MongoDB `find`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `replaceOne`, `deleteOne`, and `deleteMany`.

Passwords are hashed with `bcryptjs`. Password hashes are never included in API responses. All `/api/users` endpoints require an authenticated session.

## Technologies

- Node.js and Express
- MongoDB Atlas and Mongoose
- Passport Local Strategy and `express-session`
- `bcryptjs`, `dotenv`, and Pug

## Setup

1. Install Node.js.
2. Clone this repository and enter the project folder:
   ```bash
   git clone YOUR_REPOSITORY_URL
   cd hw65
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the project root (do not commit it):
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
   SESSION_SECRET=replace_with_a_long_random_secret
   PORT=3000
   ```
5. In MongoDB Atlas, configure a database user and Network Access so your computer can connect.
6. Start the server:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:3000`, register an account, and log in.

## Authentication

- `GET /register` — registration page.
- `POST /register` — creates a login account (password is hashed).
- `GET /login` — login page.
- `POST /login` — authenticates with Passport Local.
- `POST /logout` — ends the session.
- `GET /protected` — protected profile page.
- `GET /users` — protected HTML page listing users without password hashes.

The JSON endpoints below use the same session authentication. First log in through the browser. For API clients, keep the session cookie returned by the login flow and send it with each request. Unauthenticated requests are redirected to `/login`.

## CRUD API

Base path: `/api/users`

The API uses the existing `users` collection. The `email` field is unique. Passwords must contain at least six characters and are hashed before storage. API responses never return `password`.

### 1. Read documents — `find()` and projection

**Request**

```http
GET /api/users?fields=_id,email,createdAt
```

Optional query parameters:
- `fields` — comma-separated list of allowed fields: `_id`, `email`, `createdAt`, `updatedAt`. If omitted, all public fields are returned (the password is always excluded).
- `email` — filter by one exact email address.

**Example response — `200 OK`**

```json
{
  "count": 1,
  "users": [
    {
      "_id": "665f1a2b3c4d5e6f78901234",
      "email": "alex@example.com",
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

Implemented in `src/controllers/userApiController.js` (`findUsers`) with `User.find(filter, projection)`.

### 2. Insert one document — `insertOne`

**Request**

```http
POST /api/users
Content-Type: application/json

{
  "email": "new.user@example.com",
  "password": "strongpass123"
}
```

**Example response — `201 Created`**

```json
{
  "message": "User created",
  "user": {
    "_id": "665f1a2b3c4d5e6f78901234",
    "email": "new.user@example.com",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:00:00.000Z"
  }
}
```

Implemented by `User.collection.insertOne()` in `insertOne`. Duplicate email returns `409 Conflict`; invalid input returns `400 Bad Request`.

### 3. Insert multiple documents — `insertMany`

**Request**

```http
POST /api/users/bulk
Content-Type: application/json

{
  "users": [
    { "email": "anna@example.com", "password": "strongpass123" },
    { "email": "max@example.com", "password": "anotherpass123" }
  ]
}
```

**Example response — `201 Created`**

```json
{
  "message": "Users created",
  "insertedCount": 2,
  "users": [
    { "_id": "665f1a2b3c4d5e6f78901235", "email": "anna@example.com" },
    { "_id": "665f1a2b3c4d5e6f78901236", "email": "max@example.com" }
  ]
}
```

IDs and dates in examples are illustrative. Implemented with `User.collection.insertMany()`. The request must contain 1–100 users.

### 4. Update one document — `updateOne`

Replace `:id` with the user's MongoDB `_id`.

**Request**

```http
PATCH /api/users/665f1a2b3c4d5e6f78901234
Content-Type: application/json

{
  "email": "updated@example.com"
}
```

**Example response — `200 OK`**

```json
{
  "message": "User updated",
  "matchedCount": 1,
  "modifiedCount": 1,
  "user": {
    "_id": "665f1a2b3c4d5e6f78901234",
    "email": "updated@example.com"
  }
}
```

The body can contain `email`, `password`, or both. A supplied password is hashed. Implemented with `User.collection.updateOne()`.

### 5. Update multiple documents — `updateMany`

**Request**

```http
PATCH /api/users/bulk/update
Content-Type: application/json

{
  "filter": { "emailDomain": "example.com" },
  "update": { "email": "shared@example.com" }
}
```

This illustrative update may fail with `409 Conflict` if it causes duplicate email addresses. For a successful practical test, use a non-conflicting update, for example update a shared password for matching test users:

```json
{
  "filter": { "emailDomain": "example.com" },
  "update": { "password": "newpassword123" }
}
```

**Example response — `200 OK`**

```json
{
  "message": "Users updated",
  "matchedCount": 2,
  "modifiedCount": 2
}
```

Supported filters: `{ "email": "person@example.com" }`, `{ "emailDomain": "example.com" }`, or `{ "_id": "validMongoObjectId" }`. A non-empty filter is mandatory. Implemented with `User.collection.updateMany()`.

### 6. Replace one document — `replaceOne`

`replaceOne` replaces the document's fields, rather than patching only selected fields. The `_id` stays the same. The replacement must include both `email` and `password`.

**Request**

```http
PUT /api/users/665f1a2b3c4d5e6f78901234/replace
Content-Type: application/json

{
  "email": "replacement@example.com",
  "password": "replacementpass123"
}
```

**Example response — `200 OK`**

```json
{
  "message": "User replaced",
  "matchedCount": 1,
  "modifiedCount": 1,
  "user": {
    "_id": "665f1a2b3c4d5e6f78901234",
    "email": "replacement@example.com"
  }
}
```

Implemented with `User.collection.replaceOne()`. The password is hashed before storage.

### 7. Delete one document — `deleteOne`

**Request**

```http
DELETE /api/users/665f1a2b3c4d5e6f78901234
```

**Example response — `200 OK`**

```json
{
  "message": "User deleted",
  "deletedCount": 1
}
```

Implemented with `User.collection.deleteOne()`. Returns `404 Not Found` if no user has that ID.

### 8. Delete multiple documents — `deleteMany`

**Request**

```http
DELETE /api/users/bulk
Content-Type: application/json

{
  "filter": { "emailDomain": "example.com" }
}
```

**Example response — `200 OK`**

```json
{
  "message": "Users deleted",
  "deletedCount": 2
}
```

Supported filters are exact `email`, `emailDomain`, or `_id`. An empty filter is rejected to prevent accidentally deleting every user. Implemented with `User.collection.deleteMany()`.

## Common status codes

- `200 OK` — read, update, replace, or delete completed.
- `201 Created` — document(s) created.
- `400 Bad Request` — invalid input, ID, projection, or missing bulk filter.
- `401`/redirect to login — no authenticated session.
- `404 Not Found` — requested user ID does not exist.
- `409 Conflict` — email already exists or violates the unique index.
- `500 Internal Server Error` — unexpected server/database error.

## Files added or updated

- `src/controllers/userApiController.js` — CRUD operations and input validation.
- `src/routes/authRoutes.js` — protected API routes.
- `README.md` — setup steps, route descriptions, examples, and response samples.

## Security notes

- Never commit `.env`; keep `MONGODB_URI` and `SESSION_SECRET` in local environment variables or your deployment provider's environment-variable settings.
- Do not use real customer data for demonstrations.
- Bulk update and delete operations require a non-empty supported filter.
- Passwords are hashed with bcrypt before insertion or update and are omitted from query results.
