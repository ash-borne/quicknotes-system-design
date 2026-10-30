# QuickNotes Data Model

## Entities

- **users**: `id` (INTEGER, PK), `email` (TEXT, unique), `password_hash` (TEXT), `created_at` (DATETIME)
- **notes**: `id` (INTEGER, PK), `user_id` (INTEGER, FK to users), `title` (TEXT), `body` (TEXT, optional), `created_at` and `updated_at` (DATETIME)
- **tags**: `id` (INTEGER, PK), `user_id` (INTEGER, FK to users), `name` (TEXT, unique per user)
- **note_tags**: `note_id` (INTEGER, FK to notes) and `tag_id` (INTEGER, FK to tags), which together form the primary key

## Relationships

- **users to notes: one-to-many.** One user has many notes, and each note belongs to one user.
- **users to tags: one-to-many.** One user has many tags, and each tag belongs to one user.
- **notes to tags: many-to-many.** A note can have many tags, and a tag can be on many notes. A relational table cannot hold a list in one cell, so the join table `note_tags` stores one row for each note and tag pair.

## CREATE TABLE statements

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name    TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
);

CREATE INDEX idx_notes_user_created ON notes(user_id, created_at);
```

## Example queries

```sql
-- 1. A user's 20 newest notes
SELECT id, title, created_at
FROM notes
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 20;

-- 2. A user's notes with a given tag (uses JOINs)
SELECT notes.id, notes.title
FROM notes
JOIN note_tags ON note_tags.note_id = notes.id
JOIN tags      ON tags.id = note_tags.tag_id
WHERE notes.user_id = ? AND tags.name = ?;

-- 3. How many notes each of a user's tags has
SELECT tags.name, COUNT(note_tags.note_id) AS note_count
FROM tags
LEFT JOIN note_tags ON note_tags.tag_id = tags.id
WHERE tags.user_id = ?
GROUP BY tags.id, tags.name;

-- 4. Create a note
INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?);
```

The `?` placeholders keep user text out of the SQL string, which prevents SQL injection.

## Index

- **Added:** `idx_notes_user_created` on `notes(user_id, created_at)`.
- **Reason:** the most common request is "show this user's newest notes". The index lets the database jump to one user's notes already in date order, instead of scanning and sorting every note.
- **Trade-off:** it uses a little extra storage and makes inserts slightly slower.

## SQL or NoSQL?

I would choose SQL (for example PostgreSQL). The data is structured and connected: users own notes and tags, and notes and tags are linked many-to-many. SQL handles this with joins and enforces rules such as unique emails and foreign keys, so a note can never point to a user who does not exist. Reads and writes are simple, and a million users is well within what one SQL primary with replicas can handle. NoSQL would suit very flexible or enormous data, but we do not need that here, and we would lose joins and strict integrity.