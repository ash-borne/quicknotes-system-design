# QuickNotes Architecture

## Requirements

**Functional**
- Sign in, then create, read, update and delete notes
- Tag notes and filter the list by tag

**Non-functional**
- Scale to 1 million users
- Fast reads: notes list in under 200 ms for most requests
- High availability: about 99.9%, with no single point of failure
- Durability: a saved note is never lost (backups and replication)
- Security: HTTPS, token login, users see only their own notes

## Load estimate for 1 million users

Assumptions: 20% of users are active each day (200,000), each views their notes 20 times and creates 5 notes per day, a day is about 100,000 seconds, peak is 5x the average, and a note takes about 1 KB.

- **Reads:** 4,000,000 per day = **40 per second** average, **200 per second** peak
- **Writes:** 1,000,000 per day = **10 per second** average, **50 per second** peak
- **Storage:** 1,000,000 notes per day x 365 x 1 KB = about **365 GB per year**
- The system is **read-heavy** (about 4 reads for every write)

## Architecture diagram

```
       Client (browser or mobile app)
                    |
                    v
                   DNS
                    |
         +----------+-----------+
         v                      v
        CDN              Load balancer
   (static files)                |
                    +------------+------------+
                    v                         v
              App server 1              App server 2
                    |                         |
        +-----------+------------+------------+
        |           |            |            |
        v           v            v            v
      Cache     Primary DB   Read replica   Queue
     (Redis)        |   copies to  ^          |
                    +--------------+          v
                                            Worker
```

## Components and the problem each one solves

- **Client:** shows the notes and sends API requests, solving the need for a user interface.
- **DNS:** turns the API name into the address of the load balancer, so users never need an IP address.
- **CDN:** serves static files (HTML, CSS, JavaScript) from servers near the user, solving slow loading and saving our servers work.
- **Load balancer:** spreads requests over the app servers, solving overload and a single point of failure.
- **App servers:** run the API logic, and because they keep no state, more can be added as traffic grows.
- **Cache (Redis):** keeps recent note lists in memory, solving repeated slow database reads.
- **Primary database:** stores all users, notes and tags, and is the single place where writes happen.
- **Read replica:** a copy of the primary that answers read queries, solving read overload.
- **Queue:** holds background jobs, solving slow requests because users do not wait for extra work.
- **Worker:** takes jobs from the queue (such as reminder emails and exports) and runs them away from the API.

## Request flows

**GET /notes**
1. The client resolves the API name through DNS and sends the request to the load balancer.
2. The load balancer passes it to an app server, which checks the token (401 if invalid).
3. The app server looks for the user's notes in the cache.
4. On a cache hit, it returns them immediately.
5. On a miss, it reads the notes from the read replica and saves them in the cache for 60 seconds.
6. It returns `200 OK` with the JSON list.

**POST /notes**
1. The client sends the JSON body, and the load balancer picks an app server.
2. The app server checks the token and validates the title (400 if empty or over 100 characters).
3. It inserts the note into the primary database.
4. It deletes the user's cached list, so the next read is fresh.
5. It puts a job on the queue, which a worker handles later.
6. It returns `201 Created` with the new note.

## Trade-offs

- **Cache: speed vs fresh data.** The cache makes reads fast, but it can show old data until it is cleared or expires, and clearing it correctly adds complexity.
- **Read replica: scale vs lag.** A replica spreads the read load, but it can be a moment behind the primary, so a new note may not appear instantly. Reading a user's own recent data from the primary reduces this.
- **Queue: fast responses vs delay.** The API replies quickly, but background work finishes later.
- **Redundancy: reliability vs cost.** Running two or more of everything costs more and is harder to operate, but it keeps the service up.

## Avoiding single points of failure

- **DNS:** use a provider with several name servers.
- **CDN and load balancer:** the CDN has many edge servers, and the load balancer runs as a pair that takes over if one fails.
- **App servers:** at least two, in different zones, and the load balancer stops sending traffic to a failed one.
- **Cache:** if it fails, requests fall back to the read replica, and the cache can be replicated.
- **Database:** the primary has a replica that can be promoted, plus regular backups.
- **Queue and workers:** the queue stores jobs durably, and several workers share them, so a failed worker's job is retried.