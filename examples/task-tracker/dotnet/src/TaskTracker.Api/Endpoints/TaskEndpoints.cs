using TaskTracker.Api.Contracts;
using TaskTracker.Api.Domain;

namespace TaskTracker.Api.Endpoints;

/// <summary>
/// CRUD endpoints for tasks, mounted under <c>/tasks</c>.
/// </summary>
/// <remarks>
/// GET /tasks currently returns EVERY task, unfiltered. Closing that gap — adding optional
/// <c>?status=</c> and <c>?priority=</c> filters — is the exercise the CHAOS worked example
/// drives end-to-end. See <c>docs/demo/README.md</c>.
/// </remarks>
public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/tasks");

        // GET /tasks — optional ?status= and ?priority= filters (AND-combined when both are
        // supplied). The endpoint only binds/parses/validates; the filtering itself is
        // domain-owned (TaskStore.Query). An unrecognized value is rejected with 400 (PROP-DEC-001).
        group.MapGet("/", (string? status, string? priority, TaskStore store) =>
        {
            TaskState? statusFilter = null;
            if (status is not null)
            {
                // IsDefined rejects numeric-but-out-of-range input (e.g. "99"), which
                // TryParse alone would accept as an undefined enum value (APP-DEC-002).
                if (!Enum.TryParse<TaskState>(status, ignoreCase: true, out var parsedStatus)
                    || !Enum.IsDefined(typeof(TaskState), parsedStatus))
                    return Results.BadRequest(new { error = $"Unknown status value: '{status}'." });
                statusFilter = parsedStatus;
            }

            TaskPriority? priorityFilter = null;
            if (priority is not null)
            {
                if (!Enum.TryParse<TaskPriority>(priority, ignoreCase: true, out var parsedPriority)
                    || !Enum.IsDefined(typeof(TaskPriority), parsedPriority))
                    return Results.BadRequest(new { error = $"Unknown priority value: '{priority}'." });
                priorityFilter = parsedPriority;
            }

            return Results.Ok(store.Query(statusFilter, priorityFilter));
        });

        // GET /tasks/{id}
        group.MapGet("/{id:guid}", (Guid id, TaskStore store) =>
            store.Get(id) is { } task ? Results.Ok(task) : Results.NotFound());

        // POST /tasks
        group.MapPost("/", (CreateTaskRequest request, TaskStore store) =>
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return Results.BadRequest(new { error = "Title is required." });

            var task = store.Add(request.Title, request.Status, request.Priority);
            return Results.Created($"/tasks/{task.Id}", task);
        });

        // PUT /tasks/{id}
        group.MapPut("/{id:guid}", (Guid id, UpdateTaskRequest request, TaskStore store) =>
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return Results.BadRequest(new { error = "Title is required." });

            return store.Update(id, request.Title, request.Status, request.Priority) is { } updated
                ? Results.Ok(updated)
                : Results.NotFound();
        });

        // DELETE /tasks/{id}
        group.MapDelete("/{id:guid}", (Guid id, TaskStore store) =>
            store.Remove(id) ? Results.NoContent() : Results.NotFound());

        return app;
    }
}
