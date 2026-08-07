using TaskTracker.Api.Contracts;
using TaskTracker.Api.Domain;

namespace TaskTracker.Api.Endpoints;

/// <summary>
/// CRUD endpoints for tasks, mounted under <c>/tasks</c>.
/// </summary>
/// <remarks>
/// GET /tasks supports optional <c>?status=</c> and <c>?priority=</c> filters. Filtering lives
/// here in the endpoint layer, over <see cref="TaskStore.All"/> — <see cref="TaskStore"/> owns
/// no query logic (see <c>.chaos/architecture.md</c>, module and boundary model).
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

        // GET /tasks — every task, optionally narrowed by ?status= and/or ?priority=.
        //
        // Both values parse case-insensitively, and an unrecognized value is a 400 — unknown
        // names AND numeric out-of-range — per the 2026-07-19 task-filter-validation decision
        // (.chaos/decisions/index.md). Supplying both filters narrows with AND, and each filter
        // takes exactly one value (decision DEC-...-5cf3, 2026-08-07). An absent parameter means
        // no filtering at all, so a caller that sends neither sees exactly what it saw before.
        group.MapGet("/", (TaskStore store, string? status, string? priority) =>
        {
            if (!TryParseFilter<TaskState>(status, out var statusFilter))
                return Results.BadRequest(new { error = InvalidFilterMessage<TaskState>("status", status!) });

            if (!TryParseFilter<TaskPriority>(priority, out var priorityFilter))
                return Results.BadRequest(new { error = InvalidFilterMessage<TaskPriority>("priority", priority!) });

            var tasks = store.All().AsEnumerable();

            if (statusFilter is { } wantedStatus)
                tasks = tasks.Where(task => task.Status == wantedStatus);

            if (priorityFilter is { } wantedPriority)
                tasks = tasks.Where(task => task.Priority == wantedPriority);

            return Results.Ok(tasks.ToList());
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
    /// Parses an optional filter value into <typeparamref name="T"/>.
    /// Returns <c>false</c> only when a value was supplied and is not a single defined member.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Two guards matter here, and neither is incidental:
    /// </para>
    /// <para>
    /// <b>Enum.IsDefined</b> — <see cref="Enum.TryParse{TEnum}(string, bool, out TEnum)"/> also
    /// accepts numeric strings, so <c>?status=7</c> would otherwise parse into an undefined
    /// <see cref="TaskState"/> and silently match nothing. The 2026-07-19 decision names numeric
    /// out-of-range as a 400 explicitly, and this is what delivers it. Note the corollary: an
    /// <i>in-range</i> numeric such as <c>?status=1</c> is accepted, because that decision scopes
    /// the rejection to out-of-range values.
    /// </para>
    /// <para>
    /// <b>The comma guard</b> — <c>Enum.TryParse</c> accepts comma-separated lists even for enums
    /// without <see cref="FlagsAttribute"/>: <c>"Open,Done"</c> would bitwise-OR into
    /// <see cref="TaskState.Done"/> and quietly return the wrong set. The approved contract is
    /// exactly one value per filter, so a comma is rejected rather than reinterpreted.
    /// </para>
    /// <para>
    /// A <c>null</c> value means the parameter was not supplied — no filter, no error. A blank
    /// value (<c>?status=</c>) is a supplied value that names nothing, so it is a 400.
    /// </para>
    /// </remarks>
    private static bool TryParseFilter<T>(string? value, out T? filter) where T : struct, Enum
    {
        filter = null;

        if (value is null)
            return true;

        if (value.Contains(','))
            return false;

        if (!Enum.TryParse<T>(value, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed))
            return false;

        filter = parsed;
        return true;
    }

    /// <summary>Error body text for a rejected filter value, listing what would have worked.</summary>
    private static string InvalidFilterMessage<T>(string parameter, string value) where T : struct, Enum =>
        $"Unrecognized {parameter} filter value '{value}'. Expected exactly one of: " +
        $"{string.Join(", ", Enum.GetNames<T>())} (case-insensitive).";
}
