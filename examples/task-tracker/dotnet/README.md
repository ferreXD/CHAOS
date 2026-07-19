# Task Tracker API (C#/.NET) — CHAOS demo starting point

A small, **fully runnable** ASP.NET Core Minimal API with an in-memory task store and plain
CRUD. It exists to be the *starting point* for the [CHAOS worked example](../../../docs/demo/README.md):
the API works, but `GET /tasks` has **no filtering** — and adding optional `?status=` /
`?priority=` filters is the change the demo drives through the CHAOS lifecycle
(propose → review → apply → verify → archive → sync).

> This is the `dotnet` variant. As CHAOS grows language specialists, sibling variants will live
> next to it (`examples/task-tracker/<language>/`) implementing the same scenario.

## Requirements

- [.NET SDK 8.0+](https://dotnet.microsoft.com/download) (targets `net8.0`; builds fine on newer SDKs).

## Run it

```bash
cd examples/task-tracker/dotnet
dotnet run --project src/TaskTracker.Api      # listens on http://localhost:5080
```

Then, in another terminal:

```bash
curl http://localhost:5080/tasks
```

The store is seeded, so you get tasks back immediately:

```json
[
  { "id": "…", "title": "Write the project README",              "status": "Done",       "priority": "Medium", "createdAt": "2026-07-13T09:00:00+00:00" },
  { "id": "…", "title": "Add query-param filters to GET /tasks",  "status": "Open",       "priority": "High",   "createdAt": "2026-07-13T11:00:00+00:00" },
  { "id": "…", "title": "Review the CHAOS proposal",              "status": "InProgress", "priority": "High",   "createdAt": "2026-07-14T09:00:00+00:00" },
  { "id": "…", "title": "Clean up sample data",                   "status": "Open",       "priority": "Low",    "createdAt": "2026-07-15T09:00:00+00:00" }
]
```

(The store is in-memory, so every restart resets to the seed data.
[`src/TaskTracker.Api/TaskTracker.Api.http`](src/TaskTracker.Api/TaskTracker.Api.http) has ready-made requests for VS Code / Rider REST clients.)

## Endpoints

| Method | Route | Description |
|---|---|---|
| `GET`    | `/`             | health check → `{ "service": "task-tracker", "status": "ok" }` |
| `GET`    | `/tasks`        | list **all** tasks — *no filtering yet (this is the gap the demo closes)* |
| `GET`    | `/tasks/{id}`   | get one task, or `404` |
| `POST`   | `/tasks`        | create a task → `201 Created` |
| `PUT`    | `/tasks/{id}`   | replace a task, or `404` |
| `DELETE` | `/tasks/{id}`   | delete a task → `204`, or `404` |

`status` is `Open | InProgress | Done`; `priority` is `Low | Medium | High` (serialized as names).

## Test it

```bash
cd examples/task-tracker/dotnet
dotnet test
```

Five integration tests boot the API in-memory (`WebApplicationFactory<Program>`) and exercise
the CRUD endpoints. They pin today's behavior and give the CHAOS apply/verify steps a green
baseline to extend.

## Project layout

```
examples/task-tracker/dotnet/
  TaskTracker.sln
  src/TaskTracker.Api/
    Program.cs                 # host + JSON enum config + endpoint wiring
    Domain/TaskItem.cs         # TaskItem record, TaskState/TaskPriority enums
    Domain/TaskStore.cs        # in-memory store (seeded)
    Endpoints/TaskEndpoints.cs # the CRUD endpoints  ← GET /tasks changes here
    Contracts/TaskRequests.cs  # Create/Update request bodies
    TaskTracker.Api.http       # sample requests
  tests/TaskTracker.Tests/
    TaskEndpointsTests.cs      # CRUD integration tests
```

> **Note on naming:** the status enum is `TaskState`, not `TaskStatus`, because `TaskStatus`
> collides with `System.Threading.Tasks.TaskStatus` under .NET's implicit global usings. The
> CHAOS apply step reuses this naming when implementing the filter.

## The exercise: add filtering with CHAOS

Right now `GET /tasks` returns everything. The goal:

```
GET /tasks?status=open
GET /tasks?priority=high
GET /tasks?status=inprogress&priority=high     # combine → AND
```

The interesting part isn't the ~12 lines of LINQ — it's the **governed** questions: what does
the code do today, what should an *invalid* filter value do, who decided, and where is that
written down? Walk it end-to-end (an illustrative guided tour) in
[**docs/demo/README.md**](../../../docs/demo/README.md) — or read the **real, captured lifecycle**
of this exact change on the [`demo/dotnet` branch](https://github.com/ferreXD/CHAOS/tree/demo/dotnet).
