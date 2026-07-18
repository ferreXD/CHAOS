using TaskTracker.Api.Domain;

namespace TaskTracker.Api.Contracts;

/// <summary>Request body for POST /tasks.</summary>
public record CreateTaskRequest(string Title, TaskState Status, TaskPriority Priority);

/// <summary>Request body for PUT /tasks/{id}.</summary>
public record UpdateTaskRequest(string Title, TaskState Status, TaskPriority Priority);
