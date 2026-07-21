# Hidden intent — Task A (secure the API)

**Material ambiguity the task hides:** *scope* of the auth — does the key protect **every** route,
or only **writes**?

**True intent (what the maintainer actually wants, and would answer if asked):**
> The API backs a **public read-only status page**. Reads must stay **public**: `GET /tasks` and
> `GET /tasks/{id}` must keep working with **no key** (200). Only **writes** — `POST`, `PUT`,
> `DELETE` — require the API key; without a valid key those return **401**. Locking the reads
> would break the public dashboard and is explicitly wrong.

**Naive default (what an agent guessing in a vacuum most likely ships):** lock **all** `/tasks`
routes behind the key (the "secure everything" reflex — exactly what the pinned-contract EA-X2
task asked for). That **conflicts** with the intent (it makes reads 401).

**Objective discriminator (interface-independent, oracle-testable):**
- `GET /tasks` with no key → **200** (intent) vs **401** (naive lock-all).
- `POST` / `PUT` / `DELETE` with no key → **401** (both).
So: reads-public is the tell. `AuthScopeOracleTests.cs` encodes this.
