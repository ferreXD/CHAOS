using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// Covers the api-authentication capability: which routes demand a credential, how bad
/// credentials are answered, and that configuration is external and validated at startup.
/// </summary>
public class AuthenticationTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;

    public AuthenticationTests(TestApiFactory factory) => _factory = factory;

    public static TheoryData<string, string> ProtectedRoutes() => new()
    {
        { "GET", "/tasks" },
        { "GET", "/tasks/11111111-1111-1111-1111-111111111111" },
        { "POST", "/tasks" },
        { "PUT", "/tasks/11111111-1111-1111-1111-111111111111" },
        { "DELETE", "/tasks/11111111-1111-1111-1111-111111111111" },
    };

    [Theory]
    [MemberData(nameof(ProtectedRoutes))]
    public async Task Every_task_route_rejects_a_request_with_no_credential(string method, string route)
    {
        var client = _factory.CreateClient();

        var request = new HttpRequestMessage(new HttpMethod(method), route);
        if (method is "POST" or "PUT")
        {
            request.Content = JsonContent.Create(new { title = "Should never be created" });
        }

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Unauthenticated_write_creates_nothing()
    {
        var anonymous = _factory.CreateClient();
        var authenticated = _factory.CreateAuthenticatedClient();

        var before = await authenticated.GetFromJsonAsync<List<TaskEndpointsTests.TaskDto>>("/tasks");

        var rejected = await anonymous.PostAsJsonAsync("/tasks", new { title = "Ghost task" });
        Assert.Equal(HttpStatusCode.Unauthorized, rejected.StatusCode);

        var after = await authenticated.GetFromJsonAsync<List<TaskEndpointsTests.TaskDto>>("/tasks");
        Assert.Equal(before!.Count, after!.Count);
        Assert.DoesNotContain(after!, t => t.Title == "Ghost task");
    }

    [Fact]
    public async Task Unknown_task_without_a_credential_is_401_not_404()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/tasks/{Guid.NewGuid()}");

        // Authentication must run before the handler, so the API does not disclose whether the
        // resource exists to a caller that has not authenticated.
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Token_with_an_invalid_signature_is_rejected()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            TestApiFactory.MintToken(signingKey: "a-completely-different-signing-key-of-length"));

        var response = await client.GetAsync("/tasks");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Expired_token_is_rejected()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            TestApiFactory.MintToken(lifetime: TimeSpan.FromMinutes(-10)));

        var response = await client.GetAsync("/tasks");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Token_from_an_unexpected_issuer_is_rejected()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", TestApiFactory.MintToken(issuer: "some-other-issuer"));

        var response = await client.GetAsync("/tasks");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Token_for_an_unexpected_audience_is_rejected()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", TestApiFactory.MintToken(audience: "some-other-audience"));

        var response = await client.GetAsync("/tasks");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Liveness_endpoint_stays_anonymous()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<HealthDto>();
        Assert.Equal("task-tracker", body!.Service);
        Assert.Equal("ok", body.Status);
    }

    [Fact]
    public async Task Startup_fails_when_the_signing_key_is_missing()
    {
        // Build the same host the app builds, minus the signing key. Startup must refuse.
        using var factory = new MissingKeyFactory();

        var error = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());

        Assert.Contains("Auth:SigningKey", error.Message);
    }

    private record HealthDto(string Service, string Status);

    /// <summary>
    /// Supplies issuer/audience but deliberately clears the signing key, so the fail-fast path
    /// is exercised rather than an unrelated configuration error.
    /// </summary>
    private sealed class MissingKeyFactory : Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Auth:Issuer", TestApiFactory.Issuer);
            builder.UseSetting("Auth:Audience", TestApiFactory.Audience);
            // Auth:SigningKey is deliberately never supplied, and appsettings.json does not
            // carry it either - so this is the genuine "missing secret" startup path.
        }
    }
}
