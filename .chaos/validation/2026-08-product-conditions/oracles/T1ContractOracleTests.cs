using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// Independent oracle for the T1 prompt's stated contract. Written by the evaluator, not by any
/// arm: "accepting Low, Medium or High", "omitting the parameter keeps today's behaviour",
/// "an unrecognised value is a 400".
/// </summary>
public class T1ContractOracleTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;

    public T1ContractOracleTests(TestApiFactory factory) => _factory = factory;

    [Theory]
    [InlineData("Low")]
    [InlineData("Medium")]
    [InlineData("High")]
    public async Task Accepts_the_three_named_priorities(string priority)
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync($"/tasks?priority={priority}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var tasks = await response.Content.ReadFromJsonAsync<List<TaskEndpointsTests.TaskDto>>();
        Assert.All(tasks!, t => Assert.Equal(priority, t.Priority));
    }

    [Fact]
    public async Task Omitting_the_parameter_returns_everything()
    {
        var client = _factory.CreateAuthenticatedClient();

        var tasks = await client.GetFromJsonAsync<List<TaskEndpointsTests.TaskDto>>("/tasks");

        Assert.NotNull(tasks);
        Assert.True(tasks!.Count >= 4);
        Assert.Contains(tasks!, t => t.Priority != "High");
    }

    [Theory]
    [InlineData("Urgent")]    // not a member at all
    [InlineData("0")]         // underlying number of Low
    [InlineData("99")]        // number with no matching member
    [InlineData("Low,High")]  // flags-style combination
    public async Task An_unrecognised_value_is_a_400(string priority)
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync($"/tasks?priority={Uri.EscapeDataString(priority)}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
