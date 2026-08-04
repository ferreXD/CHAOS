using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// Integration tests that boot the real API in-memory and exercise the CRUD endpoints over HTTP.
/// These lock in the pre-existing behaviour and give the CHAOS apply/verify steps a green
/// baseline. Since secure-task-api, every /tasks call must present a bearer token - the assertions
/// about status and body are unchanged, only the client is authenticated.
/// </summary>
public class TaskEndpointsTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;

    public TaskEndpointsTests(TestApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Get_tasks_returns_the_seeded_tasks()
    {
        var client = _factory.CreateAuthenticatedClient();

        var tasks = await client.GetFromJsonAsync<List<TaskDto>>("/tasks");

        Assert.NotNull(tasks);
        Assert.NotEmpty(tasks!);
        Assert.Contains(tasks!, t => t.Title == "Add query-param filters to GET /tasks");
    }

    [Fact]
    public async Task Post_creates_a_task_and_get_by_id_returns_it()
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(
            "/tasks", new { title = "Write tests", status = "Open", priority = "High" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<TaskDto>();
        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created!.Id);

        var fetched = await client.GetFromJsonAsync<TaskDto>($"/tasks/{created.Id}");
        Assert.Equal("Write tests", fetched!.Title);
        Assert.Equal("Open", fetched.Status);
        Assert.Equal("High", fetched.Priority);
    }

    [Fact]
    public async Task Put_updates_an_existing_task()
    {
        var client = _factory.CreateAuthenticatedClient();
        var created = await (await client.PostAsJsonAsync(
            "/tasks", new { title = "Draft", status = "Open", priority = "Low" }))
            .Content.ReadFromJsonAsync<TaskDto>();

        var update = await client.PutAsJsonAsync(
            $"/tasks/{created!.Id}", new { title = "Final", status = "Done", priority = "Medium" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var fetched = await client.GetFromJsonAsync<TaskDto>($"/tasks/{created.Id}");
        Assert.Equal("Final", fetched!.Title);
        Assert.Equal("Done", fetched.Status);
    }

    [Fact]
    public async Task Delete_removes_a_task()
    {
        var client = _factory.CreateAuthenticatedClient();
        var created = await (await client.PostAsJsonAsync(
            "/tasks", new { title = "Temporary", status = "Open", priority = "Low" }))
            .Content.ReadFromJsonAsync<TaskDto>();

        var delete = await client.DeleteAsync($"/tasks/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var getAfter = await client.GetAsync($"/tasks/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getAfter.StatusCode);
    }

    [Fact]
    public async Task Post_with_blank_title_is_rejected()
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(
            "/tasks", new { title = "", status = "Open", priority = "Low" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_tasks_with_high_priority_filter_returns_only_high_priority_tasks()
    {
        var client = _factory.CreateAuthenticatedClient();

        var tasks = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?priority=High");

        Assert.NotNull(tasks);
        Assert.NotEmpty(tasks!);
        Assert.All(tasks, t => Assert.Equal("High", t.Priority));
        // Verify at least the two seeded High tasks
        Assert.True(tasks.Count >= 2, "Expected at least 2 High priority tasks from seed data");
    }

    [Fact]
    public async Task Get_tasks_with_medium_priority_filter_returns_only_medium_priority_tasks()
    {
        var client = _factory.CreateAuthenticatedClient();

        var tasks = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?priority=Medium");

        Assert.NotNull(tasks);
        Assert.All(tasks, t => Assert.Equal("Medium", t.Priority));
        // Seed has at least 1 Medium task
        Assert.True(tasks.Count >= 1, "Expected at least 1 Medium priority task from seed data");
    }

    [Fact]
    public async Task Get_tasks_without_priority_filter_returns_all_tasks()
    {
        var client = _factory.CreateAuthenticatedClient();

        var all = await client.GetFromJsonAsync<List<TaskDto>>("/tasks");
        var high = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?priority=High");
        var medium = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?priority=Medium");
        var low = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?priority=Low");

        Assert.NotNull(all);
        Assert.NotEmpty(all!);
        // The three filters partition the unfiltered list exactly: nothing the caller would have
        // seen before is dropped when a filter is applied, and nothing is invented.
        Assert.Equal(
            all!.OrderBy(t => t.Id).ToList(),
            high!.Concat(medium!).Concat(low!).OrderBy(t => t.Id).ToList());
    }

    [Fact]
    public async Task Get_tasks_with_case_insensitive_priority_filter()
    {
        var client = _factory.CreateAuthenticatedClient();

        var resultHigh = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?priority=High");
        var resultHIGH = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?priority=HIGH");
        var resulthigh = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?priority=high");

        Assert.Equal(resultHigh, resultHIGH);
        Assert.Equal(resultHigh, resulthigh);
    }

    [Fact]
    public async Task Get_tasks_with_unrecognized_priority_returns_bad_request()
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/tasks?priority=Urgent");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        // Same error body shape the blank-title checks already use, and it names what IS accepted.
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"error\"", body);
        Assert.Contains("Low, Medium, High", body);
        Assert.DoesNotContain("\"title\"", body);
    }

    [Fact]
    public async Task Get_tasks_with_numeric_priority_string_returns_bad_request()
    {
        var client = _factory.CreateAuthenticatedClient();

        var response2 = await client.GetAsync("/tasks?priority=2");
        Assert.Equal(HttpStatusCode.BadRequest, response2.StatusCode);

        var response7 = await client.GetAsync("/tasks?priority=7");
        Assert.Equal(HttpStatusCode.BadRequest, response7.StatusCode);
    }

    [Fact]
    public async Task Get_tasks_with_empty_priority_parameter_returns_bad_request()
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/tasks?priority=");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_tasks_with_comma_separated_priority_returns_bad_request()
    {
        var client = _factory.CreateAuthenticatedClient();

        // Enum.TryParse accepts comma-separated lists for ANY enum, not just [Flags] ones:
        // "Low,High" ORs to 0|2 = High, and Enum.IsDefined then says it is a declared value.
        // "Low,High" is not a priority name, so it must be rejected like any other bad input.
        var response = await client.GetAsync("/tasks?priority=Low,High");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>Mirror of the API's task shape; enums arrive as strings ("Open", "High").</summary>
    internal record TaskDto(Guid Id, string Title, string Status, string Priority, DateTimeOffset CreatedAt);
}
