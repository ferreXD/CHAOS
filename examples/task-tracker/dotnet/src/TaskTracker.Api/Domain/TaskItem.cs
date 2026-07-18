namespace TaskTracker.Api.Domain;

/// <summary>
/// Work-item status. Deliberately named <c>TaskState</c> rather than <c>TaskStatus</c>:
/// the latter collides with <see cref="System.Threading.Tasks.TaskStatus"/> under .NET's
/// implicit global usings. (The CHAOS apply step reuses this naming — see docs/demo/README.md.)
/// </summary>
public enum TaskState
{
    Open,
    InProgress,
    Done
}

/// <summary>Work-item priority.</summary>
public enum TaskPriority
{
    Low,
    Medium,
    High
}

/// <summary>An immutable task record held in the in-memory store.</summary>
public record TaskItem(
    Guid Id,
    string Title,
    TaskState Status,
    TaskPriority Priority,
    DateTimeOffset CreatedAt);
