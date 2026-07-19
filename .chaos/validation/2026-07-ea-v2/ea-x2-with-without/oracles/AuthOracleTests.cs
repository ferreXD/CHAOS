using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TaskTracker.Oracle;

/// <summary>
/// HELD-OUT ORACLE for Task 1 (API-key auth). Black-box HTTP only; never references the
/// implementation's internal types. Authored BEFORE either arm ran. Contract under test:
/// every /tasks route requires header X-Api-Key == "test-secret-key" (config "ApiKey",
/// default "test-secret-key"); missing/wrong key -> 401 before any read/mutate; GET / stays
/// public. Each [Fact] is one defect trap.
/// </summary>
public class AuthOracleTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Key = "test-secret-key";
    private readonly WebApplicationFactory<Program> _factory;

    public AuthOracleTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private HttpClient WithKey()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Add("X-Api-Key", Key);
        return c;
    }

    private HttpClient NoKey() => _factory.CreateClient();

    private HttpClient WrongKey()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Add("X-Api-Key", "not-the-key");
        return c;
    }

    private static readonly Guid SomeId = new("11111111-1111-1111-1111-111111111111");

    [Fact] // trap: GET /tasks unprotected
    public async Task Get_list_without_key_is_401()
    {
        var r = await NoKey().GetAsync("/tasks");
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // trap: GET /tasks/{id} unprotected OR existence-checked before auth (info leak)
    public async Task Get_by_id_without_key_is_401()
    {
        var r = await NoKey().GetAsync($"/tasks/{SomeId}");
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // trap: write route left open
    public async Task Post_without_key_is_401()
    {
        var r = await NoKey().PostAsJsonAsync("/tasks",
            new { title = "x", status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // trap: PUT left open (should be 401, not 404, on unknown id without key)
    public async Task Put_without_key_is_401()
    {
        var r = await NoKey().PutAsJsonAsync($"/tasks/{SomeId}",
            new { title = "x", status = "Open", priority = "Low" });
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // trap: DELETE left open (the easiest route to forget)
    public async Task Delete_without_key_is_401()
    {
        var r = await NoKey().DeleteAsync($"/tasks/{SomeId}");
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // trap: wrong key accepted
    public async Task Wrong_key_is_401()
    {
        var r = await WrongKey().GetAsync("/tasks");
        Assert.Equal(HttpStatusCode.Unauthorized, r.StatusCode);
    }

    [Fact] // positive: valid key admits reads
    public async Task Valid_key_can_list_tasks()
    {
        var r = await WithKey().GetAsync("/tasks");
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var body = await r.Content.ReadFromJsonAsync<List<OracleTaskDto>>();
        Assert.NotNull(body);
        Assert.NotEmpty(body!);
    }

    [Fact] // positive: valid key admits writes + read-back
    public async Task Valid_key_can_create_and_read_back()
    {
        var client = WithKey();
        var create = await client.PostAsJsonAsync("/tasks",
            new { title = "auth-oracle", status = "Open", priority = "High" });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = await create.Content.ReadFromJsonAsync<OracleTaskDto>();
        Assert.NotNull(created);
        var fetched = await client.GetAsync($"/tasks/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, fetched.StatusCode);
    }

    [Fact] // trap: health root wrongly locked down
    public async Task Root_health_stays_public()
    {
        var r = await NoKey().GetAsync("/");
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
    }

    private record OracleTaskDto(Guid Id, string Title, string Status, string Priority);
}
