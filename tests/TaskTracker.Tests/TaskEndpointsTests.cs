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

    /// <summary>Mirror of the API's task shape; enums arrive as strings ("Open", "High").</summary>
    internal record TaskDto(Guid Id, string Title, string Status, string Priority, DateTimeOffset CreatedAt);
}
