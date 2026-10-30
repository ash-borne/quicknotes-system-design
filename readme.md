# QuickNotes System Design

QuickNotes is moving from a browser-only app to an online service for 1 million people. This project has two parts: a small API client that proves the front end can talk to an API (using the JSONPlaceholder practice API), and three design documents for the real backend.

## Run the API client

1. Clone the repository:
   ```
   git clone https://github.com/your-username/quicknotes-system-design.git
   ```
2. Open the folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server** (or open `index.html` in your browser).
4. Click **Load notes** to load 10 notes, use the form to add one, and click **Delete** to remove one.

An internet connection is needed because the client calls `https://jsonplaceholder.typicode.com/posts`.

## Design documents

- [API design](docs/api-design.md): the REST endpoints, examples and error codes
- [Data model](docs/data-model.md): tables, relationships, SQL, an index and SQL vs NoSQL
- [Architecture](docs/architecture.md): requirements, load estimate, diagram, request flows and trade-offs

## What I learned

- How to write one reusable `request()` function that uses `fetch`, checks `response.ok` and throws on errors, so GET, POST and DELETE all share the same error handling.
- How to show loading, success, error and empty states, and disable buttons while a request is running.
- That a practice API like JSONPlaceholder does not really save data, so the client has to handle that sensibly.
- How to design a REST API with the right methods, paths, status codes and error bodies.
- How tables, keys and a join table model a many-to-many relationship, and how an index speeds up common queries.
- How to estimate load and design a system with caching, replicas and queues, while avoiding single points of failure.