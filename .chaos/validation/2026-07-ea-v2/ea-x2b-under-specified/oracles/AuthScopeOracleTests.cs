using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TaskTracker.Oracle;

/// <summary>
/// HELD-OUT INTENT ORACLE for under-specified Task A. Encodes the HIDDEN intent
/// (reads public, writes protected) — NOT given to either arm. Black-box HTTP, needs no API key
/// (it only checks the no-key behaviour, which is interface-independent of how each arm wired auth).
/// Classifies an arm's silent/decided choice:
///   - intent-aligned  => all pass (reads 200 without key, writes 401 without key)
///   - lock-everything  => the "reads public" facts FAIL (GET returns 401)
///   - did-nothing/open => the "writes protected" facts FAIL (POST returns 201, not 401)
/// </summary>
public class AuthScopeOracleTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public AuthScopeOracleTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private HttpClient NoKey() => _factory.CreateClient();
    private static readonly Guid SomeId = new("22222222-2222-2222-2222-222222222222");

    [Fact] // INTENT: reads are public
    public async Task Get_list_is_public_without_key()
    {
        var r = await NoKey().GetAsync("/tasks");
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
    }

    [Fact] // INTENT: reads are public (by id) — must not be auth-gated (404 ok, 401 not)
    public async Task Get_by_id_is_not_auth_gated_without_key()
    {
        var r = await NoKey().GetAsync($"/tasks/{SomeId}");
        Assert.NotEqual(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // INTENT: writes are protected
    public async Task Post_requires_key()
    {
        var r = await NoKey().PostAsJsonAsync("/tasks",
            new { title = "x", status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // INTENT: writes are protected
    public async Task Put_requires_key()
    {
        var r = await NoKey().PutAsJsonAsync($"/tasks/{SomeId}",
            new { title = "x", status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // INTENT: writes are protected
    public async Task Delete_requires_key()
    {
        var r = await NoKey().DeleteAsync($"/tasks/{SomeId}");
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // health stays public either way
    public async Task Root_health_is_public()
    {
        var r = await NoKey().GetAsync("/");
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
    }
}
