using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// Independent oracle for the T3 prompt's stated contract. Written by the evaluator, not by any
/// arm: "Record the owning user on each task, taking the identity from the authenticated caller's
/// JWT subject claim. GET /tasks must return only the caller's own tasks, and reading, updating or
/// deleting someone else's task must be a 404."
/// </summary>
public class T3ContractOracleTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;

    public T3ContractOracleTests(TestApiFactory factory) => _factory = factory;

    private static object Body(string title) =>
        new { title, status = "Open", priority = "Medium" };

    private async Task<string> CreateAs(string subject, string title)
    {
        var client = _factory.CreateAuthenticatedClient(subject);
        var response = await client.PostAsJsonAsync("/tasks", Body(title));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("id").GetString()!;
    }

    [Fact]
    public async Task List_returns_only_the_callers_own_tasks()
    {
        var alice = _factory.CreateAuthenticatedClient("oracle-alice");
        await CreateAs("oracle-alice", "alice task");
        await CreateAs("oracle-bob", "bob task");

        using var doc = JsonDocument.Parse(await alice.GetStringAsync("/tasks"));
        var titles = doc.RootElement.EnumerateArray()
            .Select(t => t.GetProperty("title").GetString()).ToList();

        Assert.Contains("alice task", titles);
        Assert.DoesNotContain("bob task", titles);
        // The pre-existing seeds belong to a different subject and must not leak either.
        Assert.DoesNotContain("Write the project README", titles);
    }

    [Fact]
    public async Task Reading_someone_elses_task_is_a_404()
    {
        var id = await CreateAs("oracle-owner-read", "private");
        var stranger = _factory.CreateAuthenticatedClient("oracle-stranger-read");

        var response = await stranger.GetAsync($"/tasks/{id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Updating_someone_elses_task_is_a_404()
    {
        var id = await CreateAs("oracle-owner-update", "private");
        var stranger = _factory.CreateAuthenticatedClient("oracle-stranger-update");

        var response = await stranger.PutAsJsonAsync($"/tasks/{id}", Body("hijacked"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Deleting_someone_elses_task_is_a_404()
    {
        var id = await CreateAs("oracle-owner-delete", "private");
        var stranger = _factory.CreateAuthenticatedClient("oracle-stranger-delete");

        var response = await stranger.DeleteAsync($"/tasks/{id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task A_failed_cross_owner_delete_does_not_destroy_the_task()
    {
        var id = await CreateAs("oracle-owner-survive", "still here");
        var stranger = _factory.CreateAuthenticatedClient("oracle-stranger-survive");
        await stranger.DeleteAsync($"/tasks/{id}");

        var owner = _factory.CreateAuthenticatedClient("oracle-owner-survive");
        var response = await owner.GetAsync($"/tasks/{id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task The_owner_can_still_read_update_and_delete_their_own_task()
    {
        var id = await CreateAs("oracle-solo", "mine");
        var owner = _factory.CreateAuthenticatedClient("oracle-solo");

        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/tasks/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.PutAsJsonAsync($"/tasks/{id}", Body("mine, edited"))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/tasks/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/tasks/{id}")).StatusCode);
    }

    [Fact]
    public async Task Ownership_follows_the_jwt_subject_not_the_connection()
    {
        var id = await CreateAs("oracle-subject-a", "belongs to a");

        // Same process, different token subject: the task must be invisible.
        var otherSubject = _factory.CreateAuthenticatedClient("oracle-subject-b");
        Assert.Equal(HttpStatusCode.NotFound, (await otherSubject.GetAsync($"/tasks/{id}")).StatusCode);

        // A fresh client on the original subject still sees it.
        var sameSubject = _factory.CreateAuthenticatedClient("oracle-subject-a");
        Assert.Equal(HttpStatusCode.OK, (await sameSubject.GetAsync($"/tasks/{id}")).StatusCode);
    }
}
