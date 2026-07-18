using System.Collections.Concurrent;

namespace TaskTracker.Api.Domain;

/// <summary>
/// Process-lifetime, in-memory task store. Registered as a singleton, so all requests share
/// one instance for the lifetime of the process. Thread-safe for the demo's needs.
/// </summary>
public class TaskStore
{
    private readonly ConcurrentDictionary<Guid, TaskItem> _tasks = new();

    public TaskStore()
    {
        // Seed a few tasks (with fixed, realistic timestamps so creation order is stable)
        // so GET /tasks returns something on first run.
        var seedBase = new DateTimeOffset(2026, 7, 13, 9, 0, 0, TimeSpan.Zero);
        AddAt("Write the project README", TaskState.Done, TaskPriority.Medium, seedBase);
        AddAt("Add query-param filters to GET /tasks", TaskState.Open, TaskPriority.High, seedBase.AddHours(2));
        AddAt("Review the CHAOS proposal", TaskState.InProgress, TaskPriority.High, seedBase.AddDays(1));
        AddAt("Clean up sample data", TaskState.Open, TaskPriority.Low, seedBase.AddDays(2));
    }

    /// <summary>All tasks, in creation order.</summary>
    public IReadOnlyList<TaskItem> All() =>
        _tasks.Values.OrderBy(t => t.CreatedAt).ToList();

    public TaskItem? Get(Guid id) =>
        _tasks.TryGetValue(id, out var task) ? task : null;

    public TaskItem Add(string title, TaskState status, TaskPriority priority) =>
        AddAt(title, status, priority, DateTimeOffset.UtcNow);

    public TaskItem? Update(Guid id, string title, TaskState status, TaskPriority priority)
    {
        if (!_tasks.TryGetValue(id, out var existing))
            return null;

        var updated = existing with { Title = title, Status = status, Priority = priority };
        _tasks[id] = updated;
        return updated;
    }

    public bool Remove(Guid id) => _tasks.TryRemove(id, out _);

    private TaskItem AddAt(string title, TaskState status, TaskPriority priority, DateTimeOffset createdAt)
    {
        var task = new TaskItem(Guid.NewGuid(), title, status, priority, createdAt);
        _tasks[task.Id] = task;
        return task;
    }
}
