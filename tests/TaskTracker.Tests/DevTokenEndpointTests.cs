using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// The dev-only token issuance endpoint (REV-DEC-003, design D7) is the highest residual risk in
/// this change: if it ever reaches a deployed environment it mints credentials for anyone. These
/// tests exist to prove BOTH gates hold independently, and that the route is genuinely absent
/// rather than present-and-refusing.
/// </summary>
public class DevTokenEndpointTests
{
    private const string Route = "/dev/token";

    private static TestApiFactory Factory(bool flagEnabled, string environment) =>
        TestApiFactory.With(new Dictionary<string, string?>
        {
            ["Auth:EnableDevTokenEndpoint"] = flagEnabled ? "true" : "false",
        }, environment);

    [Fact]
    public async Task Both_gates_satisfied_issues_a_usable_token()
    {
        using var factory = Factory(flagEnabled: true, Environments.Development);
        var client = factory.CreateClient();

        var response = await client.PostAsync(Route, content: null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var issued = await response.Content.ReadFromJsonAsync<TokenDto>();
        Assert.False(string.IsNullOrWhiteSpace(issued!.Access_Token));

        // The issued token must actually work against the protected surface.
        var authenticated = factory.CreateClient();
        authenticated.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", issued.Access_Token);

        Assert.Equal(HttpStatusCode.OK, (await authenticated.GetAsync("/tasks")).StatusCode);
    }

    [Fact]
    public async Task Not_development_means_the_route_is_absent_even_with_the_flag_on()
    {
        using var factory = Factory(flagEnabled: true, Environments.Production);
        var client = factory.CreateClient();

        var response = await client.PostAsync(Route, content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Staging_with_the_flag_on_is_also_absent()
    {
        using var factory = Factory(flagEnabled: true, Environments.Staging);
        var client = factory.CreateClient();

        var response = await client.PostAsync(Route, content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Development_with_the_flag_off_is_absent()
    {
        using var factory = Factory(flagEnabled: false, Environments.Development);
        var client = factory.CreateClient();

        var response = await client.PostAsync(Route, content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Flag_absent_entirely_defaults_to_disabled()
    {
        // No Auth:EnableDevTokenEndpoint key at all - a fresh deployment must be safe without
        // anyone remembering to switch it off.
        using var factory = TestApiFactory.With(new Dictionary<string, string?>(), Environments.Development);
        var client = factory.CreateClient();

        var response = await client.PostAsync(Route, content: null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private record TokenDto(string Access_Token, int Expires_In);
}
