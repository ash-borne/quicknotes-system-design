# QuickNotes API Design

This is the REST API the backend team should build for the real QuickNotes service (not the JSONPlaceholder practice API).

## Conventions

- Base URL: `https://api.quicknotes.example/v1`
- All requests and responses use JSON (`Content-Type: application/json`)
- Every endpoint except login needs the header `Authorization: Bearer <token>`
- Users can only see and change their own notes
- URLs name resources (plural nouns) and the HTTP method says the action

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | `/auth/login` | Exchange email and password for a token | 200 OK |
| GET | `/notes` | List the user's notes (`?tag=`, `?page=`, `?limit=`) | 200 OK |
| GET | `/notes/{id}` | Get one note | 200 OK |
| POST | `/notes` | Create a note | 201 Created |
| PUT | `/notes/{id}` | Replace a note's title and body | 200 OK |
| DELETE | `/notes/{id}` | Delete a note | 204 No Content |
| GET | `/tags` | List the user's tags | 200 OK |
| PUT | `/notes/{id}/tags/{tagId}` | Add a tag to a note | 204 No Content |

## Create a note

`POST /notes`

Request body:

```json
{
  "title": "Buy milk",
  "body": "Two litres, and bread",
  "tags": ["personal"]
}
```

Response: `201 Created`, with the header `Location: /v1/notes/42`

```json
{
  "id": 42,
  "title": "Buy milk",
  "body": "Two litres, and bread",
  "tags": ["personal"],
  "createdAt": "2026-11-05T09:30:00Z",
  "updatedAt": "2026-11-05T09:30:00Z"
}
```

## List notes

`GET /notes?page=1&limit=2`

Response: `200 OK`

```json
{
  "notes": [
    { "id": 42, "title": "Buy milk", "tags": ["personal"], "createdAt": "2026-11-05T09:30:00Z" },
    { "id": 41, "title": "Call Grace", "tags": ["work"], "createdAt": "2026-11-04T16:10:00Z" }
  ],
  "page": 1,
  "limit": 2,
  "total": 37
}
```

## Error codes

| Code | Meaning | Example |
|---|---|---|
| 400 Bad Request | The request is invalid | `POST /notes` with an empty title, or a title over 100 characters |
| 401 Unauthorized | Missing or invalid token | A request with no `Authorization` header, or an expired token |
| 403 Forbidden | Logged in, but not allowed | Trying to read or delete another user's note |
| 404 Not Found | The resource does not exist | `GET /notes/999` when no such note exists |
| 500 Internal Server Error | An unexpected server problem | The database is unreachable |

Example error body (the same shape is used for every error):

```json
{
  "error": {
    "status": 400,
    "code": "VALIDATION_ERROR",
    "message": "title is required and must be 100 characters or fewer"
  }
}
```