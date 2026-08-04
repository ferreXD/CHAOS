using TaskTracker.Api.Contracts;
using TaskTracker.Api.Domain;

namespace TaskTracker.Api.Endpoints;

/// <summary>
/// CRUD endpoints for tasks, mounted under <c>/tasks</c>.
/// </summary>
/// <remarks>
/// GET /tasks takes an optional <c>?priority=</c> filter (filter-tasks-by-priority). The matching
/// <c>?status=</c> filter, and combining the two with AND, remain the open half of that gap —
/// see <c>docs/demo/README.md</c>.
/// </remarks>
public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        // Group-level auth + rate limiting: a route added here later is protected by default,
        // rather than depending on someone remembering to decorate it.
        var group = app.MapGroup("/tasks")
            .RequireAuthorization()
            .RequireRateLimiting(Policies.TaskRateLimit);

        // GET /tasks — every task, or only those at ?priority= when the caller supplies one.
        // Filtering happens here rather than in the store: the store stays a plain collection
        // and query concerns stay on the HTTP side of the boundary.
        group.MapGet("/", (string? priority, TaskStore store) =>
        {
            if (priority is null)
                return Results.Ok(store.All());

            if (TryMatchPriority(priority) is not { } match)
                return Results.BadRequest(new
                {
                    error = $"Unknown priority. Accepted values: {string.Join(", ", Enum.GetNames<TaskPriority>())}."
                });

            return Results.Ok(store.All().Where(t => t.Priority == match).ToList());
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

    /// <summary>
    /// The <see cref="TaskPriority"/> whose name equals <paramref name="value"/> ignoring case,
    /// or <c>null</c> when the caller asked for something that is not a priority.
    /// </summary>
    /// <remarks>
    /// Deliberately NOT <c>Enum.TryParse</c>: that accepts far more than the three names a caller
    /// may legitimately send. It parses numeric strings ("2" → High), accepts out-of-range numbers
    /// ("7" → an undefined value, still returning true), and ORs comma-separated lists together
    /// ("Low,High" → 0|2 → High) even for an enum that is not [Flags]. Matching the declared names
    /// explicitly is the only way the 400 contract actually holds.
    /// </remarks>
    private static TaskPriority? TryMatchPriority(string value) =>
        Enum.GetValues<TaskPriority>()
            .Cast<TaskPriority?>()
            .FirstOrDefault(p => string.Equals(p!.Value.ToString(), value, StringComparison.OrdinalIgnoreCase));
}
