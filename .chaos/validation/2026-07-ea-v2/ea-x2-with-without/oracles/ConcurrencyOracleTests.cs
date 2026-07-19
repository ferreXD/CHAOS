using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TaskTracker.Oracle;

/// <summary>
/// HELD-OUT ORACLE for Task 3 (optimistic concurrency). Black-box HTTP only. Authored BEFORE
/// either arm ran. Contract: task carries version (new/seeded start at 1); every successful
/// PUT increments version; UpdateTaskRequest gains optional expectedVersion — provided+stale
/// -> 409 with the task unchanged, provided+matching -> 200, omitted -> unconditional update.
/// Each [Fact] is one defect trap.
/// </summary>
public class ConcurrencyOracleTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public ConcurrencyOracleTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private async Task<OracleTaskDto> CreateAsync(HttpClient c, string title)
    {
        var r = await c.PostAsJsonAsync("/tasks",
            new { title, status = "Open", priority = "Low" });
        r.EnsureSuccessStatusCode();
        return (await r.Content.ReadFromJsonAsync<OracleTaskDto>())!;
    }

    [Fact] // trap: version field missing / not initialized to 1
    public async Task New_task_starts_at_version_1()
    {
        var c = _factory.CreateClient();
        var created = await CreateAsync(c, "v-init");
        Assert.Equal(1, created.Version);
    }

    [Fact] // trap: successful PUT does not increment version
    public async Task Successful_put_increments_version()
    {
        var c = _factory.CreateClient();
        var created = await CreateAsync(c, "v-bump");

        var put = await c.PutAsJsonAsync($"/tasks/{created.Id}",
            new { title = "v-bump-2", status = "Done", priority = "High", expectedVersion = 1 });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var updated = await put.Content.ReadFromJsonAsync<OracleTaskDto>();
        Assert.Equal(2, updated!.Version);
    }

    [Fact] // trap: no concurrency check — stale expectedVersion should 409, not 200 (lost update)
    public async Task Stale_expected_version_conflicts()
    {
        var c = _factory.CreateClient();
        var created = await CreateAsync(c, "v-stale");

        // First writer moves version 1 -> 2.
        var first = await c.PutAsJsonAsync($"/tasks/{created.Id}",
            new { title = "first-write", status = "InProgress", priority = "Medium", expectedVersion = 1 });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        // Second writer still thinks it is version 1 -> must be rejected.
        var stale = await c.PutAsJsonAsync($"/tasks/{created.Id}",
            new { title = "stale-write", status = "Done", priority = "Low", expectedVersion = 1 });
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
    }

    [Fact] // trap: task mutated even though the conflicting write was rejected
    public async Task Conflicting_write_leaves_task_unchanged()
    {
        var c = _factory.CreateClient();
        var created = await CreateAsync(c, "v-unchanged");

        await c.PutAsJsonAsync($"/tasks/{created.Id}",
            new { title = "keeper", status = "InProgress", priority = "Medium", expectedVersion = 1 });

        await c.PutAsJsonAsync($"/tasks/{created.Id}",
            new { title = "should-not-apply", status = "Done", priority = "Low", expectedVersion = 1 });

        var current = await c.GetFromJsonAsync<OracleTaskDto>($"/tasks/{created.Id}");
        Assert.Equal("keeper", current!.Title);   // stale write must not have applied
        Assert.Equal(2, current.Version);          // and must not have bumped the version
    }

    [Fact] // positive/back-compat: omitting expectedVersion still updates unconditionally
    public async Task Omitted_expected_version_updates_unconditionally()
    {
        var c = _factory.CreateClient();
        var created = await CreateAsync(c, "v-omit");

        var put = await c.PutAsJsonAsync($"/tasks/{created.Id}",
            new { title = "no-version-check", status = "Done", priority = "High" });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var updated = await put.Content.ReadFromJsonAsync<OracleTaskDto>();
        Assert.Equal("no-version-check", updated!.Title);
        Assert.Equal(2, updated.Version);
    }

    private record OracleTaskDto(
        Guid Id, string Title, string Status, string Priority, int Version);
}
