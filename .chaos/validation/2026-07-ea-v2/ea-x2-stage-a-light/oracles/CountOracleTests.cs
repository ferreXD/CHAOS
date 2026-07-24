using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TaskTracker.Oracle;

/// <summary>
/// HELD-OUT ORACLE for Task B1 (GET /tasks/count). Black-box HTTP only; never references the
/// implementation's internal types. Authored BEFORE either arm ran. Contract under test:
/// GET /tasks/count -> 200 { "count": N } where N == length of GET /tasks; POST increments by 1,
/// DELETE decrements by 1; GET / stays public. Each [Fact] is one defect trap. Facts are written
/// to be independent of the shared in-memory store's ordering (relative deltas, self-contained).
/// </summary>
public class CountOracleTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public CountOracleTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private static async Task<int> GetCount(HttpClient c)
    {
        var r = await c.GetAsync("/tasks/count");
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var doc = await r.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Number, doc.GetProperty("count").ValueKind);
        return doc.GetProperty("count").GetInt32();
    }

    private static async Task<int> ListLength(HttpClient c)
    {
        var items = await c.GetFromJsonAsync<List<JsonElement>>("/tasks");
        Assert.NotNull(items);
        return items!.Count;
    }

    [Fact] // trap: endpoint missing / wrong shape / wrong status
    public async Task Count_endpoint_returns_200_and_integer_count()
    {
        var c = _factory.CreateClient();
        var n = await GetCount(c);
        Assert.True(n >= 0);
    }

    [Fact] // trap: count computed differently from the actual store contents
    public async Task Count_equals_list_length()
    {
        var c = _factory.CreateClient();
        Assert.Equal(await ListLength(c), await GetCount(c));
    }

    [Fact] // trap: count not affected by creation / stale
    public async Task Post_increments_count_by_one()
    {
        var c = _factory.CreateClient();
        var before = await GetCount(c);
        var resp = await c.PostAsJsonAsync("/tasks",
            new { title = "count-probe-create", status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        Assert.Equal(before + 1, await GetCount(c));
    }

    [Fact] // trap: count not affected by deletion / stale
    public async Task Delete_decrements_count_by_one()
    {
        var c = _factory.CreateClient();
        var created = await (await c.PostAsJsonAsync("/tasks",
            new { title = "count-probe-delete", status = "Open", priority = "Low" }))
            .Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetGuid();
        var before = await GetCount(c);
        var del = await c.DeleteAsync($"/tasks/{id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);
        Assert.Equal(before - 1, await GetCount(c));
    }

    [Fact] // trap: health endpoint broken by the change
    public async Task Root_health_still_public()
    {
        var c = _factory.CreateClient();
        var r = await c.GetAsync("/");
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
    }
}
