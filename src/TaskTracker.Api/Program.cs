using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using TaskTracker.Api.Domain;
using TaskTracker.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Fail fast: the app must not start without credential configuration. A development default
// signing key that reaches production is the exact failure this change exists to prevent.
var auth = AuthOptions.Load(builder.Configuration);
var limits = ApiLimits.Load(builder.Configuration);

// Defence in depth for oversized bodies; the explicit middleware below is what guarantees 413.
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = limits.MaxRequestBodyBytes);

// One in-memory store shared for the lifetime of the process.
builder.Services.AddSingleton<TaskStore>();

// Serialize enums (TaskState/TaskPriority) as their names ("Open", "High") rather than numbers,
// and accept them the same way in request bodies.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = auth.SecurityKey,
            ValidateIssuer = true,
            ValidIssuer = auth.Issuer,
            ValidateAudience = true,
            ValidAudience = auth.Audience,
            ValidateLifetime = true,
            // No leeway: an expired token is expired. The default 5-minute skew would let
            // just-expired tokens through, which undercuts the whole reason for choosing JWT.
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    // Explicit allow-list only. No wildcard origin, and credentials are never combined with one.
    options.AddPolicy(Policies.Cors, policy => policy
        .WithOrigins(limits.AllowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy(Policies.TaskRateLimit, context => RateLimitPartition.GetFixedWindowLimiter(
        RateLimitPartitionKey(context),
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = limits.PermitLimit,
            Window = TimeSpan.FromSeconds(limits.WindowSeconds),
            QueueLimit = 0,
        }));

    // GET / is anonymous, so it is reachable by any caller and needs its own (looser) limit.
    options.AddPolicy(Policies.LivenessRateLimit, context => RateLimitPartition.GetFixedWindowLimiter(
        RateLimitPartitionKey(context),
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = limits.LivenessPermitLimit,
            Window = TimeSpan.FromSeconds(limits.WindowSeconds),
            QueueLimit = 0,
        }));
});

var app = builder.Build();

// Security headers run first so they are present on every response, including 401/413/429.
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

// Reject oversized bodies deterministically with 413 rather than relying on how the JSON
// pipeline surfaces a Kestrel limit breach (which can present as 400).
app.Use(async (context, next) =>
{
    if (context.Request.ContentLength > limits.MaxRequestBodyBytes)
    {
        context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
        return;
    }

    await next();
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();

// NOTE: UseForwardedHeaders() is deliberately NOT registered. The app terminates TLS itself,
// so there is no trusted proxy set - and rule R-008 names "do not register the middleware" as
// the safe default rather than configuring an empty KnownProxies/KnownNetworks. Putting a proxy
// in front of this API is a new decision, not a config edit.

app.UseCors(Policies.Cors);

// Rate limiting MUST precede authentication: on a public-internet surface the untrusted caller
// population is the unauthenticated one, so a rejected request has to consume a permit. If
// authorization ran first, 401s would be free and JWT signature validation could be flooded.
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Tiny health/root endpoint so `curl http://localhost:5080/` shows the app is up.
app.MapGet("/", () => Results.Ok(new { service = "task-tracker", status = "ok" }))
   .RequireRateLimiting(Policies.LivenessRateLimit);

app.MapTaskEndpoints();

// Development-only token issuance, behind TWO independent gates: the Development environment
// AND an opt-in flag that defaults to false. Registration-time, not a runtime check inside the
// handler - a route that is never mapped cannot be called, and cannot lose its guard in a later
// refactor. A single wrong ASPNETCORE_ENVIRONMENT is therefore not enough to expose it.
if (app.Environment.IsDevelopment() && auth.EnableDevTokenEndpoint)
{
    app.MapPost("/dev/token", () =>
    {
        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            issuer: auth.Issuer,
            audience: auth.Audience,
            claims: new[] { new Claim(JwtRegisteredClaimNames.Sub, "dev-user") },
            notBefore: now,
            expires: now.AddMinutes(auth.TokenLifetimeMinutes),
            signingCredentials: new SigningCredentials(auth.SecurityKey, SecurityAlgorithms.HmacSha256));

        return Results.Ok(new
        {
            access_token = new JwtSecurityTokenHandler().WriteToken(token),
            expires_in = auth.TokenLifetimeMinutes * 60,
        });
    });
}

app.Run();

/// <summary>
/// Partition key for the rate limiter. Registered BEFORE authentication (see UseRateLimiter
/// above), so <c>context.User</c> is not populated yet and the remote-IP branch is what runs in
/// practice; the authenticated branch is kept because the spec asks for the caller when one is
/// available, and it becomes live if the ordering ever changes.
/// </summary>
static string RateLimitPartitionKey(HttpContext context) =>
    context.User?.Identity?.IsAuthenticated == true
        ? $"user:{context.User.Identity!.Name}"
        : $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";

/// <summary>Named policies, so endpoint registration cannot drift from configuration.</summary>
public static class Policies
{
    public const string Cors = "task-tracker-cors";
    public const string TaskRateLimit = "task-rate-limit";
    public const string LivenessRateLimit = "liveness-rate-limit";
}

/// <summary>
/// Credential configuration. Supplied from OUTSIDE the repository; <see cref="Load"/> throws
/// when anything required is missing, so the app never starts half-secured.
/// </summary>
public sealed record AuthOptions(
    string Issuer,
    string Audience,
    string SigningKey,
    int TokenLifetimeMinutes,
    bool EnableDevTokenEndpoint)
{
    public SymmetricSecurityKey SecurityKey { get; } =
        new(Encoding.UTF8.GetBytes(SigningKey));

    public static AuthOptions Load(IConfiguration configuration)
    {
        var section = configuration.GetSection("Auth");

        var issuer = section["Issuer"];
        var audience = section["Audience"];
        var signingKey = section["SigningKey"];

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(issuer)) missing.Add("Auth:Issuer");
        if (string.IsNullOrWhiteSpace(audience)) missing.Add("Auth:Audience");
        if (string.IsNullOrWhiteSpace(signingKey)) missing.Add("Auth:SigningKey");

        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"Missing required authentication configuration: {string.Join(", ", missing)}. " +
                "Supply it via user-secrets, environment variables, or the platform secret store - " +
                "never by committing it to the repository.");
        }

        return new AuthOptions(
            issuer!,
            audience!,
            signingKey!,
            section.GetValue("TokenLifetimeMinutes", 60),
            // Defaults to false: a fresh deployment is safe without anyone remembering to set it.
            section.GetValue("EnableDevTokenEndpoint", false));
    }
}

/// <summary>Edge-hardening configuration (rate limits, CORS allow-list, body size).</summary>
public sealed record ApiLimits(
    int PermitLimit,
    int WindowSeconds,
    int LivenessPermitLimit,
    string[] AllowedOrigins,
    long MaxRequestBodyBytes)
{
    public static ApiLimits Load(IConfiguration configuration)
    {
        var rateLimiting = configuration.GetSection("RateLimiting");

        return new ApiLimits(
            rateLimiting.GetValue("PermitLimit", 100),
            rateLimiting.GetValue("WindowSeconds", 60),
            rateLimiting.GetValue("LivenessPermitLimit", 300),
            configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>(),
            configuration.GetValue("Limits:MaxRequestBodyBytes", 32768L));
    }
}

// Exposed so the integration tests can boot the app via WebApplicationFactory<Program>.
public partial class Program { }
