using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace TaskTracker.Tests;

/// <summary>
/// Integration tests for the optional <c>?status=</c> / <c>?priority=</c> filters on GET /tasks.
/// </summary>
/// <remarks>
/// <para>
/// These assert the contract approved at the 2026-08-07 pre-code stop
/// (decision <c>DEC-2026-08-07-...-5cf3</c>, option <c>approve-as-planned</c>): the two filters
/// combine with AND, each takes exactly one value, and a blank value is rejected — layered on
/// the 2026-07-19 task-filter-validation decision, which requires 400 for unrecognized values
/// (unknown names <i>and</i> numeric out-of-range) and case-insensitive parsing.
/// </para>
/// <para>
/// This class deliberately performs no writes. It reads only the four tasks
/// <see cref="TaskTracker.Api.Domain.TaskStore"/> seeds at construction, so the counts below are
/// deterministic. <c>IClassFixture</c> gives this class its own app instance — and therefore its
/// own singleton store — so the POSTs in <see cref="TaskEndpointsTests"/> cannot leak in.
/// </para>
/// <para>Seeded fixtures: README (Done/Medium), query-param filters (Open/High),
/// CHAOS proposal (InProgress/High), sample data (Open/Low).</para>
/// </remarks>
public class TaskFilterTests : IClassFixture<TestApiFactory>
{
    private const string FiltersTask = "Add query-param filters to GET /tasks";
    private const string ProposalTask = "Review the CHAOS proposal";

    private readonly TestApiFactory _factory;

    public TaskFilterTests(TestApiFactory factory) => _factory = factory;

    // ---------------------------------------------------------------- happy paths

    [Fact]
    public async Task No_filters_returns_everything_unchanged()
    {
        // The backward-compatibility guarantee: a caller that sends no parameters sees exactly
        // what it saw before the filters existed.
        var tasks = await GetTasks("/tasks");

        Assert.Equal(4, tasks.Count);
    }

    [Fact]
    public async Task Status_filter_returns_only_matching_tasks()
    {
        var tasks = await GetTasks("/tasks?status=Open");

        Assert.Equal(2, tasks.Count);
        Assert.All(tasks, task => Assert.Equal("Open", task.Status));
    }

    [Fact]
    public async Task Priority_filter_returns_only_matching_tasks()
    {
        var tasks = await GetTasks("/tasks?priority=High");

        Assert.Equal(2, tasks.Count);
        Assert.All(tasks, task => Assert.Equal("High", task.Priority));
    }

    [Fact]
    public async Task Both_filters_combine_with_AND()
    {
        // The approved semantics. Two tasks are Open and two are High, but only one is both —
        // an OR reading would return three, so this test is what pins the choice.
        var tasks = await GetTasks("/tasks?status=Open&priority=High");

        var task = Assert.Single(tasks);
        Assert.Equal(FiltersTask, task.Title);
    }

    [Fact]
    public async Task Both_filters_matching_nothing_returns_an_empty_list_not_404()
    {
        var tasks = await GetTasks("/tasks?status=Done&priority=Low");

        Assert.Empty(tasks);
    }

    [Theory]
    [InlineData("/tasks?status=open&priority=high")]
    [InlineData("/tasks?status=OPEN&priority=HIGH")]
    [InlineData("/tasks?status=oPeN&priority=hIgH")]
    public async Task Filter_values_parse_case_insensitively(string url)
    {
        // Required by the 2026-07-19 decision, not merely convenient.
        var tasks = await GetTasks(url);

        var task = Assert.Single(tasks);
        Assert.Equal(FiltersTask, task.Title);
    }

    [Fact]
    public async Task In_range_numeric_value_is_accepted()
    {
        // A corollary of the recorded rule, asserted so it stays deliberate rather than
        // accidental: the 2026-07-19 decision scopes rejection to numeric OUT-OF-range, so
        // TaskState=1 (InProgress) is a valid value.
        var tasks = await GetTasks("/tasks?status=1");

        var task = Assert.Single(tasks);
        Assert.Equal(ProposalTask, task.Title);
    }

    // ---------------------------------------------------------------- rejections (400)

    [Theory]
    [InlineData("/tasks?status=Archived")]
    [InlineData("/tasks?priority=Urgent")]
    public async Task Unknown_name_is_rejected(string url)
    {
        await AssertBadRequest(url);
    }

    [Theory]
    [InlineData("/tasks?status=7")]
    [InlineData("/tasks?status=-1")]
    [InlineData("/tasks?priority=99")]
    public async Task Numeric_out_of_range_is_rejected(string url)
    {
        // Enum.TryParse alone would accept every one of these and then match nothing at all.
        // Enum.IsDefined is what turns them into the 400 the decision requires.
        await AssertBadRequest(url);
    }

    [Theory]
    [InlineData("/tasks?status=Open,Done")]
    [InlineData("/tasks?priority=Low,High")]
    public async Task Comma_separated_list_is_rejected(string url)
    {
        // Exactly one value per filter was the approved contract. Without an explicit comma
        // guard Enum.TryParse would accept "Open,Done" and bitwise-OR it into Done — silently
        // returning the wrong set rather than failing.
        await AssertBadRequest(url);
    }

    [Theory]
    [InlineData("/tasks?status=")]
    [InlineData("/tasks?priority=")]
    [InlineData("/tasks?status=%20")]
    public async Task Blank_value_is_rejected(string url)
    {
        // approve-as-planned: a supplied-but-blank value is an unrecognized value, not an
        // absent parameter.
        await AssertBadRequest(url);
    }

    [Fact]
    public async Task An_invalid_filter_is_rejected_even_when_the_other_one_is_valid()
    {
        await AssertBadRequest("/tasks?status=Archived&priority=High");
    }

    [Fact]
    public async Task Rejection_body_names_the_parameter_and_the_valid_values()
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/tasks?status=Archived");
        var body = await response.Content.ReadFromJsonAsync<ErrorDto>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull(body);
        Assert.Contains("status", body!.Error);
        Assert.Contains("Archived", body.Error);
        Assert.Contains("InProgress", body.Error);
    }

    // ---------------------------------------------------------------- auth is unchanged

    [Fact]
    public async Task Filtered_requests_still_require_authentication()
    {
        // The filters were added inside the existing MapGroup("/tasks"), so they inherit
        // authorization. This asserts the route did not escape that group.
        var anonymous = _factory.CreateClient();

        var response = await anonymous.GetAsync("/tasks?status=Open");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ---------------------------------------------------------------- helpers

    private async Task<List<TaskDto>> GetTasks(string url)
    {
        var client = _factory.CreateAuthenticatedClient();
        var tasks = await client.GetFromJsonAsync<List<TaskDto>>(url);

        Assert.NotNull(tasks);
        return tasks!;
    }

    private async Task AssertBadRequest(string url)
    {
        var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync(url);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>Mirror of the API's task shape; enums arrive as strings ("Open", "High").</summary>
    internal record TaskDto(Guid Id, string Title, string Status, string Priority, DateTimeOffset CreatedAt);

    /// <summary>Mirror of the API's error body shape, <c>{ "error": "..." }</c>.</summary>
    internal record ErrorDto(string Error);
}
