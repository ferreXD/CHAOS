using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TaskTracker.Oracle;

/// <summary>
/// HELD-OUT ORACLE for Task B3 (max title length = 200). Black-box HTTP only; never references the
/// implementation's internal types. Authored BEFORE either arm ran. Contract under test:
/// title &gt; 200 chars -> 400 on POST and PUT (no create/modify); exactly 200 accepted; existing
/// blank -> 400 preserved; normal titles still work. Each [Fact] is one defect trap and is
/// self-contained (creates its own subject where needed).
/// </summary>
public class TitleLengthOracleTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public TitleLengthOracleTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private static string OfLength(int n) => new string('a', n);

    private async Task<Guid> CreateOk(HttpClient c, string title)
    {
        var r = await c.PostAsJsonAsync("/tasks", new { title, status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var t = await r.Content.ReadFromJsonAsync<JsonElement>();
        return t.GetProperty("id").GetGuid();
    }

    [Fact] // trap: over-long title accepted on POST (no bound enforced)
    public async Task Post_title_201_chars_is_400()
    {
        var c = _factory.CreateClient();
        var r = await c.PostAsJsonAsync("/tasks",
            new { title = OfLength(201), status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
    }

    [Fact] // trap: boundary off-by-one (exactly 200 must be accepted)
    public async Task Post_title_200_chars_is_created()
    {
        var c = _factory.CreateClient();
        var r = await c.PostAsJsonAsync("/tasks",
            new { title = OfLength(200), status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
    }

    [Fact] // trap: bound enforced on POST but not PUT
    public async Task Put_title_201_chars_is_400_and_unchanged()
    {
        var c = _factory.CreateClient();
        var id = await CreateOk(c, "put-len-probe");
        var put = await c.PutAsJsonAsync($"/tasks/{id}",
            new { title = OfLength(201), status = "Done", priority = "High" });
        Assert.Equal(HttpStatusCode.BadRequest, put.StatusCode);

        var after = await c.GetFromJsonAsync<JsonElement>($"/tasks/{id}");
        Assert.Equal("put-len-probe", after.GetProperty("title").GetString());
    }

    [Fact] // trap: blank-title validation regressed while adding length check
    public async Task Post_blank_title_still_400()
    {
        var c = _factory.CreateClient();
        var r = await c.PostAsJsonAsync("/tasks",
            new { title = "", status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
    }

    [Fact] // trap: over-broad validation rejects normal titles
    public async Task Post_normal_title_still_created()
    {
        var c = _factory.CreateClient();
        var r = await c.PostAsJsonAsync("/tasks",
            new { title = "a normal title", status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
    }
}
