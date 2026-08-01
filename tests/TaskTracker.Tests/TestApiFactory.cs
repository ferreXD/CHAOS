using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace TaskTracker.Tests;

/// <summary>
/// Boots the real API in-memory with credential configuration supplied the way production would
/// supply it - from outside the repository. The app refuses to start without a signing key, so
/// every test factory must provide one explicitly.
/// </summary>
public class TestApiFactory : WebApplicationFactory<Program>
{
    public const string SigningKey = "test-signing-key-that-is-long-enough-for-hmac-sha256";
    public const string Issuer = "task-tracker-tests";
    public const string Audience = "task-tracker-test-clients";

    private readonly Dictionary<string, string?> _overrides;
    private readonly string _environment;

    // Single PUBLIC constructor: xUnit requires that of a class fixture. Tests that need
    // non-default configuration use the internal constructor via With(...).
    public TestApiFactory()
    {
        _overrides = new Dictionary<string, string?>();
        _environment = Environments.Development;
    }

    internal TestApiFactory(Dictionary<string, string?> overrides, string? environment)
    {
        _overrides = overrides;
        _environment = environment ?? Environments.Development;
    }

    internal static TestApiFactory With(
        Dictionary<string, string?> overrides,
        string? environment = null) => new(overrides, environment);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(_environment);

        var settings = new Dictionary<string, string?>
        {
            ["Auth:Issuer"] = Issuer,
            ["Auth:Audience"] = Audience,
            ["Auth:SigningKey"] = SigningKey,
            ["Auth:TokenLifetimeMinutes"] = "60",
            ["Auth:EnableDevTokenEndpoint"] = "false",
            ["RateLimiting:PermitLimit"] = "1000",
            ["RateLimiting:WindowSeconds"] = "60",
            ["RateLimiting:LivenessPermitLimit"] = "1000",
            ["Limits:MaxRequestBodyBytes"] = "32768",
        };

        foreach (var (key, value) in _overrides)
        {
            settings[key] = value;
        }

        // UseSetting, not ConfigureAppConfiguration: Program.cs reads builder.Configuration
        // during CreateBuilder (fail-fast), which is before deferred ConfigureAppConfiguration
        // callbacks run. Host settings are part of the configuration from the start.
        foreach (var (key, value) in settings)
        {
            if (value is not null)
            {
                builder.UseSetting(key, value);
            }
        }
    }

    /// <summary>A client that presents a valid bearer token on every request.</summary>
    public HttpClient CreateAuthenticatedClient()
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", MintToken());
        return client;
    }

    public static string MintToken(
        string? issuer = null,
        string? audience = null,
        string? signingKey = null,
        TimeSpan? lifetime = null)
    {
        var now = DateTime.UtcNow;
        var expires = now.Add(lifetime ?? TimeSpan.FromMinutes(60));

        // A negative lifetime mints an already-expired token; notBefore must still precede it.
        var notBefore = expires.AddMinutes(-1) < now.AddMinutes(-5)
            ? expires.AddMinutes(-1)
            : now.AddMinutes(-5);

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey ?? SigningKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer ?? Issuer,
            audience: audience ?? Audience,
            claims: new[] { new Claim(JwtRegisteredClaimNames.Sub, "test-user") },
            notBefore: notBefore,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
