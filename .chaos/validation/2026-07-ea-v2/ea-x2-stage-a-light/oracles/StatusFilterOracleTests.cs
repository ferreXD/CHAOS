using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TaskTracker.Oracle;

/// <summary>
/// HELD-OUT ORACLE for Task B2 (GET /tasks?status=). Black-box HTTP only; never references the
/// implementation's internal types. Authored BEFORE either arm ran. Contract under test:
/// ?status=&lt;state&gt; filters to that TaskState (case-insensitive); no param -> all;
/// unrecognised -> 400. Each [Fact] is one defect trap. Facts assert only on the seeded tasks'
/// invariants, so a concurrently-created probe task cannot perturb them (each seeded status count
/// is a floor; every returned item must match the requested status exactly).
/// </summary>
public class StatusFilterOracleTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public StatusFilterOracleTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private static async Task<List<JsonElement>> Get(HttpClient c, string url)
    {
        var items = await c.GetFromJsonAsync<List<JsonElement>>(url);
        Assert.NotNull(items);
        return items!;
    }

    private static string Status(JsonElement t) => t.GetProperty("status").GetString()!;

    [Fact] // trap: no-param behaviour changed (must still return everything)
    public async Task No_filter_returns_all()
    {
        var c = _factory.CreateClient();
        var all = await Get(c, "/tasks");
        Assert.True(all.Count >= 4); // four seeded tasks, at least
    }

    [Fact] // trap: filter not applied / returns other statuses
    public async Task Filter_open_returns_only_open()
    {
        var c = _factory.CreateClient();
        var open = await Get(c, "/tasks?status=Open");
        Assert.NotEmpty(open);
        Assert.All(open, t => Assert.Equal("Open", Status(t)));
    }

    [Fact] // trap: filter not applied for the single-item statuses
    public async Task Filter_done_returns_only_done()
    {
        var c = _factory.CreateClient();
        var done = await Get(c, "/tasks?status=Done");
        Assert.All(done, t => Assert.Equal("Done", Status(t)));
        Assert.Contains(done, t => t.GetProperty("title").GetString() == "Write the project README");
    }

    [Fact] // trap: filter not applied for InProgress
    public async Task Filter_inprogress_returns_only_inprogress()
    {
        var c = _factory.CreateClient();
        var ip = await Get(c, "/tasks?status=InProgress");
        Assert.All(ip, t => Assert.Equal("InProgress", Status(t)));
    }

    [Fact] // trap: case-sensitive match (contract requires case-insensitive)
    public async Task Filter_is_case_insensitive()
    {
        var c = _factory.CreateClient();
        var lower = await Get(c, "/tasks?status=open");
        Assert.NotEmpty(lower);
        Assert.All(lower, t => Assert.Equal("Open", Status(t)));
    }

    [Fact] // trap: unrecognised status silently returns [] or all instead of 400
    public async Task Unrecognised_status_is_400()
    {
        var c = _factory.CreateClient();
        var r = await c.GetAsync("/tasks?status=Bogus");
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
    }
}
