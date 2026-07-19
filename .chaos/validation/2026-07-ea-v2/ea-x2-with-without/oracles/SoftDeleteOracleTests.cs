using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TaskTracker.Oracle;

/// <summary>
/// HELD-OUT ORACLE for Task 2 (soft-delete). Black-box HTTP only. Authored BEFORE either arm
/// ran. Contract: DELETE sets deletedAt and returns 204 without hard-removing; GET /tasks
/// hides soft-deleted; GET /tasks?includeDeleted=true shows them with non-null deletedAt;
/// GET /tasks/{id} of a soft-deleted task -> 404; active tasks serialize deletedAt = null;
/// seeded rows stay active. Each [Fact] is one defect trap.
/// </summary>
public class SoftDeleteOracleTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public SoftDeleteOracleTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private async Task<OracleTaskDto> CreateAsync(HttpClient c, string title)
    {
        var r = await c.PostAsJsonAsync("/tasks",
            new { title, status = "Open", priority = "Low" });
        r.EnsureSuccessStatusCode();
        return (await r.Content.ReadFromJsonAsync<OracleTaskDto>())!;
    }

    [Fact] // positive: active tasks expose deletedAt = null
    public async Task Active_tasks_have_null_deletedAt()
    {
        var c = _factory.CreateClient();
        var list = await c.GetFromJsonAsync<List<OracleTaskDto>>("/tasks");
        Assert.NotNull(list);
        Assert.NotEmpty(list!);
        Assert.All(list!, t => Assert.Null(t.DeletedAt));
    }

    [Fact] // trap: DELETE hard-removes instead of soft-deleting
    public async Task Delete_soft_deletes_and_row_survives_with_includeDeleted()
    {
        var c = _factory.CreateClient();
        var created = await CreateAsync(c, "to-soft-delete");

        var del = await c.DeleteAsync($"/tasks/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);

        var all = await c.GetFromJsonAsync<List<OracleTaskDto>>("/tasks?includeDeleted=true");
        Assert.NotNull(all);
        var found = all!.FirstOrDefault(t => t.Id == created.Id);
        Assert.NotNull(found); // hard-delete would drop it entirely
        Assert.NotNull(found!.DeletedAt); // soft-deleted rows carry a timestamp
    }

    [Fact] // trap: default GET /tasks leaks soft-deleted rows
    public async Task Default_list_excludes_soft_deleted()
    {
        var c = _factory.CreateClient();
        var created = await CreateAsync(c, "hidden-after-delete");
        await c.DeleteAsync($"/tasks/{created.Id}");

        var active = await c.GetFromJsonAsync<List<OracleTaskDto>>("/tasks");
        Assert.NotNull(active);
        Assert.DoesNotContain(active!, t => t.Id == created.Id);
    }

    [Fact] // trap: GET /tasks/{id} still returns a soft-deleted task
    public async Task Get_by_id_of_soft_deleted_is_404()
    {
        var c = _factory.CreateClient();
        var created = await CreateAsync(c, "gone-by-id");
        await c.DeleteAsync($"/tasks/{created.Id}");

        var r = await c.GetAsync($"/tasks/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, r.StatusCode);
    }

    [Fact] // trap: deleting unknown id no longer 404s
    public async Task Delete_unknown_id_is_404()
    {
        var c = _factory.CreateClient();
        var r = await c.DeleteAsync($"/tasks/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, r.StatusCode);
    }

    private record OracleTaskDto(
        Guid Id,
        string Title,
        string Status,
        string Priority,
        [property: JsonPropertyName("deletedAt")] DateTimeOffset? DeletedAt);
}
