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

        // GET /tasks — returns every task in the store. No filtering (yet).
        group.MapGet("/", (TaskStore store) => Results.Ok(store.All()));

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
