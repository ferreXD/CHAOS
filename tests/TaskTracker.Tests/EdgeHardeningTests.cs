using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// Covers the api-edge-hardening capability. The load-bearing test here is
/// <see cref="Unauthenticated_flood_is_throttled"/>: on a public-internet surface the untrusted
/// callers are the unauthenticated ones, so a 401 must consume a permit.
/// </summary>
public class EdgeHardeningTests
{
    private static TestApiFactory Factory(params (string Key, string Value)[] overrides)
    {
        var settings = overrides.ToDictionary(o => o.Key, o => (string?)o.Value);
        return TestApiFactory.With(settings);
    }

    [Fact]
    public async Task Authenticated_caller_exceeding_the_limit_gets_429()
    {
        using var factory = Factory(("RateLimiting:PermitLimit", "3"));
        var client = factory.CreateAuthenticatedClient();

        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 5; i++)
        {
            statuses.Add((await client.GetAsync("/tasks")).StatusCode);
        }

        Assert.Contains(HttpStatusCode.TooManyRequests, statuses);
        Assert.Equal(3, statuses.Count(s => s == HttpStatusCode.OK));
    }

    [Fact]
    public async Task Unauthenticated_flood_is_throttled()
    {
        using var factory = Factory(("RateLimiting:PermitLimit", "3"));
        var client = factory.CreateClient();

        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 6; i++)
        {
            statuses.Add((await client.GetAsync("/tasks")).StatusCode);
        }

        // The first few are rejected as unauthenticated, but they still consume permits - so the
        // caller ends up throttled rather than being able to hammer credential validation freely.
        Assert.Equal(3, statuses.Count(s => s == HttpStatusCode.Unauthorized));
        Assert.Equal(3, statuses.Count(s => s == HttpStatusCode.TooManyRequests));
    }

    [Fact]
    public async Task Permits_consumed_while_unauthenticated_still_block_a_valid_token()
    {
        using var factory = Factory(("RateLimiting:PermitLimit", "2"));
        var anonymous = factory.CreateClient();

        for (var i = 0; i < 2; i++)
        {
            await anonymous.GetAsync("/tasks");
        }

        // Same partition (remote IP), now exhausted: even a good token is turned away.
        var authenticated = factory.CreateAuthenticatedClient();
        var response = await authenticated.GetAsync("/tasks");

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }

    [Fact]
    public async Task Liveness_endpoint_is_rate_limited()
    {
        using var factory = Factory(("RateLimiting:LivenessPermitLimit", "2"));
        var client = factory.CreateClient();

        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 4; i++)
        {
            statuses.Add((await client.GetAsync("/")).StatusCode);
        }

        Assert.Equal(2, statuses.Count(s => s == HttpStatusCode.OK));
        Assert.Equal(2, statuses.Count(s => s == HttpStatusCode.TooManyRequests));
    }

    [Fact]
    public async Task Normal_health_checking_is_unaffected()
    {
        using var factory = Factory(("RateLimiting:LivenessPermitLimit", "50"));
        var client = factory.CreateClient();

        for (var i = 0; i < 10; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/")).StatusCode);
        }
    }

    [Fact]
    public async Task Oversized_body_is_rejected_with_413_and_creates_nothing()
    {
        using var factory = Factory(("Limits:MaxRequestBodyBytes", "256"));
        var client = factory.CreateAuthenticatedClient();

        var payload = $$"""{"title":"{{new string('x', 2000)}}","status":"Open","priority":"Low"}""";
        var response = await client.PostAsync(
            "/tasks", new StringContent(payload, Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);

        var tasks = await client.GetFromJsonAsync<List<TaskEndpointsTests.TaskDto>>("/tasks");
        Assert.DoesNotContain(tasks!, t => t.Title.StartsWith("xxx"));
    }

    [Fact]
    public async Task Body_within_the_limit_is_processed_normally()
    {
        using var factory = Factory(("Limits:MaxRequestBodyBytes", "4096"));
        var client = factory.CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(
            "/tasks", new { title = "Small enough", status = "Open", priority = "Low" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Security_headers_are_present_on_a_successful_response()
    {
        using var factory = Factory();
        var client = factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/tasks");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertSecurityHeaders(response);
    }

    [Fact]
    public async Task Security_headers_are_present_on_error_responses()
    {
        using var factory = Factory(("RateLimiting:PermitLimit", "1"), ("Limits:MaxRequestBodyBytes", "128"));
        var client = factory.CreateClient();

        var unauthorized = await client.GetAsync("/tasks");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);
        AssertSecurityHeaders(unauthorized);

        var throttled = await client.GetAsync("/tasks");
        Assert.Equal(HttpStatusCode.TooManyRequests, throttled.StatusCode);
        AssertSecurityHeaders(throttled);
    }

    [Fact]
    public async Task Oversized_body_response_also_carries_security_headers()
    {
        using var factory = Factory(("Limits:MaxRequestBodyBytes", "128"));
        var client = factory.CreateAuthenticatedClient();

        var payload = new string('y', 1000);
        var response = await client.PostAsync(
            "/tasks", new StringContent(payload, Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
        AssertSecurityHeaders(response);
    }

    [Fact]
    public async Task Forwarded_headers_cannot_shift_the_rate_limit_partition()
    {
        // Rule R-008: UseForwardedHeaders is not registered, so a caller-supplied X-Forwarded-For
        // must not let an attacker mint a fresh rate-limit bucket per request.
        using var factory = Factory(("RateLimiting:PermitLimit", "2"));
        var client = factory.CreateClient();

        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 5; i++)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "/tasks");
            request.Headers.Add("X-Forwarded-For", $"203.0.113.{i}");
            statuses.Add((await client.SendAsync(request)).StatusCode);
        }

        Assert.Contains(HttpStatusCode.TooManyRequests, statuses);
    }

    private static void AssertSecurityHeaders(HttpResponseMessage response)
    {
        Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
        Assert.Equal("no-referrer", Assert.Single(response.Headers.GetValues("Referrer-Policy")));
    }
}
