using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// Independent oracle for the T2 prompt's stated contract. Written by the evaluator, not by any
/// arm: "an optional DueDate ... nullable, settable on create and update, and returned on every
/// task. Absent means no due date, and tasks already in the store keep working without one."
/// </summary>
public class T2ContractOracleTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;

    public T2ContractOracleTests(TestApiFactory factory) => _factory = factory;

    private static object NewTask(object? dueDate) => dueDate is null
        ? new { title = "Oracle task", status = "Open", priority = "Medium" }
        : new { title = "Oracle task", status = "Open", priority = "Medium", dueDate };

    [Fact]
    public async Task Create_without_a_due_date_succeeds_and_the_task_has_none()
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync("/tasks", NewTask(null));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.TryGetProperty("dueDate", out var due), "created task has no dueDate property");
        Assert.Equal(JsonValueKind.Null, due.ValueKind);
    }

    [Fact]
    public async Task Create_with_a_due_date_round_trips_it()
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync("/tasks", NewTask("2026-09-01T12:00:00+00:00"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        using var created = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var id = created.RootElement.GetProperty("id").GetString();
        Assert.Equal(JsonValueKind.String, created.RootElement.GetProperty("dueDate").ValueKind);

        var fetched = await client.GetStringAsync($"/tasks/{id}");
        using var doc = JsonDocument.Parse(fetched);
        Assert.Equal(
            DateTimeOffset.Parse("2026-09-01T12:00:00+00:00"),
            DateTimeOffset.Parse(doc.RootElement.GetProperty("dueDate").GetString()!));
    }

    [Fact]
    public async Task Update_can_set_a_due_date()
    {
        var client = _factory.CreateAuthenticatedClient();

        var created = await client.PostAsJsonAsync("/tasks", NewTask(null));
        using var createdDoc = JsonDocument.Parse(await created.Content.ReadAsStringAsync());
        var id = createdDoc.RootElement.GetProperty("id").GetString();

        var response = await client.PutAsJsonAsync($"/tasks/{id}",
            new { title = "Oracle task", status = "InProgress", priority = "High", dueDate = "2026-10-05T08:30:00+00:00" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(
            DateTimeOffset.Parse("2026-10-05T08:30:00+00:00"),
            DateTimeOffset.Parse(doc.RootElement.GetProperty("dueDate").GetString()!));
    }

    [Fact]
    public async Task Every_task_in_the_list_carries_the_property_even_when_it_has_no_due_date()
    {
        var client = _factory.CreateAuthenticatedClient();

        using var doc = JsonDocument.Parse(await client.GetStringAsync("/tasks"));

        var tasks = doc.RootElement.EnumerateArray().ToList();
        Assert.NotEmpty(tasks);
        foreach (var task in tasks)
        {
            Assert.True(task.TryGetProperty("dueDate", out _),
                $"task {task.GetProperty("title").GetString()} omits dueDate from its JSON");
        }
        // The seeded tasks predate the field: at least one must be present and null.
        Assert.Contains(tasks, t => t.GetProperty("dueDate").ValueKind == JsonValueKind.Null);
    }

    [Fact]
    public async Task Pre_existing_seeded_tasks_still_work()
    {
        var client = _factory.CreateAuthenticatedClient();

        using var doc = JsonDocument.Parse(await client.GetStringAsync("/tasks"));
        var seeded = doc.RootElement.EnumerateArray()
            .First(t => t.GetProperty("title").GetString() == "Write the project README");

        var response = await client.GetAsync($"/tasks/{seeded.GetProperty("id").GetString()}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var one = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(JsonValueKind.Null, one.RootElement.GetProperty("dueDate").ValueKind);
    }

    /// <summary>
    /// NOT a contract assertion — the prompt does not settle it. This records what each arm chose
    /// for a PUT body that omits dueDate on a task that has one. The plain+ask arm disclosed this
    /// choice; the plain arm did not mention it. Reported, never gated.
    /// </summary>
    [Fact]
    public async Task Observed_behaviour_put_omitting_due_date()
    {
        var client = _factory.CreateAuthenticatedClient();

        var created = await client.PostAsJsonAsync("/tasks", NewTask("2026-09-01T12:00:00+00:00"));
        using var createdDoc = JsonDocument.Parse(await created.Content.ReadAsStringAsync());
        var id = createdDoc.RootElement.GetProperty("id").GetString();

        var response = await client.PutAsJsonAsync($"/tasks/{id}",
            new { title = "Oracle task", status = "Open", priority = "Medium" });

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var kind = doc.RootElement.GetProperty("dueDate").ValueKind;
        Assert.True(kind is JsonValueKind.Null or JsonValueKind.String,
            $"OBSERVED: PUT omitting dueDate yields {kind}");
        // Surface the observation in the run log without failing either behaviour.
        Assert.True(true, kind == JsonValueKind.Null ? "OBSERVED: cleared" : "OBSERVED: preserved");
    }
}
