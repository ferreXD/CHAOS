using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// Independent oracle for the T4 prompt's stated contract. Written by the evaluator, not by any
/// arm: "Reject task titles longer than 200 characters on create and update, with a 400 and a
/// clear message. A title of exactly 200 characters is accepted."
/// </summary>
public class T4ContractOracleTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;

    public T4ContractOracleTests(TestApiFactory factory) => _factory = factory;

    private const string Subject = "oracle-t4";

    private static string Title(int length) => new string('x', length);

    private static object Body(string title) =>
        new { title, status = "Open", priority = "Medium" };

    private HttpClient Client() => _factory.CreateAuthenticatedClient(Subject);

    [Fact]
    public async Task Create_accepts_a_title_of_exactly_200()
    {
        var response = await Client().PostAsJsonAsync("/tasks", Body(Title(200)));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Create_rejects_201_with_a_400_and_a_message()
    {
        var response = await Client().PostAsJsonAsync("/tasks", Body(Title(201)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.TryGetProperty("error", out var error), "400 body has no error property");
        Assert.False(string.IsNullOrWhiteSpace(error.GetString()), "400 message is empty");
    }

    [Fact]
    public async Task Update_accepts_a_title_of_exactly_200()
    {
        var client = Client();
        var created = await client.PostAsJsonAsync("/tasks", Body("seed for update-200"));
        using var doc = JsonDocument.Parse(await created.Content.ReadAsStringAsync());
        var id = doc.RootElement.GetProperty("id").GetString();

        var response = await client.PutAsJsonAsync($"/tasks/{id}", Body(Title(200)));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Update_rejects_201_with_a_400_and_a_message()
    {
        var client = Client();
        var created = await client.PostAsJsonAsync("/tasks", Body("seed for update-201"));
        using var doc = JsonDocument.Parse(await created.Content.ReadAsStringAsync());
        var id = doc.RootElement.GetProperty("id").GetString();

        var response = await client.PutAsJsonAsync($"/tasks/{id}", Body(Title(201)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(body.RootElement.TryGetProperty("error", out var error), "400 body has no error property");
        Assert.False(string.IsNullOrWhiteSpace(error.GetString()), "400 message is empty");
    }

    [Fact]
    public async Task A_rejected_create_persists_nothing()
    {
        var client = Client();
        var tooLong = Title(201);

        await client.PostAsJsonAsync("/tasks", Body(tooLong));

        using var doc = JsonDocument.Parse(await client.GetStringAsync("/tasks"));
        Assert.DoesNotContain(doc.RootElement.EnumerateArray(),
            t => t.GetProperty("title").GetString() == tooLong);
    }

    [Fact]
    public async Task A_rejected_update_leaves_the_task_untouched()
    {
        var client = Client();
        var created = await client.PostAsJsonAsync("/tasks", Body("untouched"));
        using var doc = JsonDocument.Parse(await created.Content.ReadAsStringAsync());
        var id = doc.RootElement.GetProperty("id").GetString();

        // The rejected request also tries to change status: a partially applied update fails here.
        await client.PutAsJsonAsync($"/tasks/{id}",
            new { title = Title(201), status = "Done", priority = "High" });

        using var after = JsonDocument.Parse(await client.GetStringAsync($"/tasks/{id}"));
        Assert.Equal("untouched", after.RootElement.GetProperty("title").GetString());
        Assert.Equal("Open", after.RootElement.GetProperty("status").GetString());
        Assert.Equal("Medium", after.RootElement.GetProperty("priority").GetString());
    }

    [Fact]
    public async Task The_pre_existing_blank_title_rule_still_applies()
    {
        var response = await Client().PostAsJsonAsync("/tasks", Body("   "));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
