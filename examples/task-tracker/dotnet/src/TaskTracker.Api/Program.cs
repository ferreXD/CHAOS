using System.Text.Json.Serialization;
using TaskTracker.Api.Domain;
using TaskTracker.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// One in-memory store shared for the lifetime of the process.
builder.Services.AddSingleton<TaskStore>();

// Serialize enums (TaskState/TaskPriority) as their names ("Open", "High") rather than numbers,
// and accept them the same way in request bodies.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

var app = builder.Build();

// Tiny health/root endpoint so `curl http://localhost:5080/` shows the app is up.
app.MapGet("/", () => Results.Ok(new { service = "task-tracker", status = "ok" }));

app.MapTaskEndpoints();

app.Run();

// Exposed so the integration tests can boot the app via WebApplicationFactory<Program>.
public partial class Program { }
