using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// Integration tests that boot the real API in-memory via <see cref="WebApplicationFactory{T}"/>
/// and exercise the CRUD endpoints over HTTP. These lock in the current (pre-filtering) behavior
/// and give the CHAOS apply/verify steps a green baseline to build on.
/// </summary>
public class TaskEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public TaskEndpointsTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task Get_tasks_returns_the_seeded_tasks()
    {
        var client = _factory.CreateClient();

        var tasks = await client.GetFromJsonAsync<List<TaskDto>>("/tasks");

        Assert.NotNull(tasks);
        Assert.NotEmpty(tasks!);
        Assert.Contains(tasks!, t => t.Title == "Add query-param filters to GET /tasks");
    }

    [Fact]
    public async Task Post_creates_a_task_and_get_by_id_returns_it()
    {
        var client = _factory.CreateClient();

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
        var client = _factory.CreateClient();
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
        var client = _factory.CreateClient();
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
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/tasks", new { title = "", status = "Open", priority = "Low" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_tasks_filtered_by_status_returns_only_matching_tasks()
    {
        var client = _factory.CreateClient();

        var tasks = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?status=open");

        Assert.NotNull(tasks);
        Assert.All(tasks!, t => Assert.Equal("Open", t.Status));
        // "Clean up sample data" is a stable Open seed that no other test mutates.
        Assert.Contains(tasks!, t => t.Title == "Clean up sample data");
    }

    [Fact]
    public async Task Get_tasks_filtered_by_priority_returns_only_matching_tasks()
    {
        var client = _factory.CreateClient();

        var tasks = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?priority=high");

        Assert.NotNull(tasks);
        Assert.All(tasks!, t => Assert.Equal("High", t.Priority));
        // "Review the CHAOS proposal" is a stable High seed that no other test mutates.
        Assert.Contains(tasks!, t => t.Title == "Review the CHAOS proposal");
    }

    [Fact]
    public async Task Get_tasks_filtered_by_status_and_priority_combines_with_and()
    {
        var client = _factory.CreateClient();

        var tasks = await client.GetFromJsonAsync<List<TaskDto>>("/tasks?status=inprogress&priority=high");

        Assert.NotNull(tasks);
        Assert.All(tasks!, t =>
        {
            Assert.Equal("InProgress", t.Status);
            Assert.Equal("High", t.Priority);
        });
        // Stable seed that is both InProgress and High.
        Assert.Contains(tasks!, t => t.Title == "Review the CHAOS proposal");
    }

    [Fact]
    public async Task Get_tasks_with_invalid_status_returns_bad_request()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/tasks?status=banana");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_tasks_with_invalid_priority_returns_bad_request()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/tasks?priority=banana");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_tasks_with_numeric_out_of_range_status_returns_bad_request()
    {
        var client = _factory.CreateClient();

        // "99" is not a defined TaskState; an unrecognized value must be rejected, not
        // silently coerced into an undefined enum value (APP-DEC-002).
        var response = await client.GetAsync("/tasks?status=99");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_tasks_unfiltered_still_returns_all_tasks()
    {
        var client = _factory.CreateClient();

        var tasks = await client.GetFromJsonAsync<List<TaskDto>>("/tasks");

        Assert.NotNull(tasks);
        Assert.NotEmpty(tasks!);
        // Every seeded task, across both statuses and priorities, is present when unfiltered.
        Assert.Contains(tasks!, t => t.Title == "Clean up sample data");
        Assert.Contains(tasks!, t => t.Title == "Review the CHAOS proposal");
        Assert.Contains(tasks!, t => t.Title == "Write the project README");
    }

    /// <summary>Mirror of the API's task shape; enums arrive as strings ("Open", "High").</summary>
    private record TaskDto(Guid Id, string Title, string Status, string Priority, DateTimeOffset CreatedAt);
}
