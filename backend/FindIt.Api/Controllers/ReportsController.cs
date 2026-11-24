using FindIt.Api.Models;
using FindIt.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FindIt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ReportsController(InMemoryFindItStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult List(
        [FromQuery] string? q,
        [FromQuery] ReportType? type,
        [FromQuery] string? category,
        [FromQuery] string? color,
        [FromQuery] string? location,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var results = store.GetReports().AsEnumerable();

        if (type.HasValue) results = results.Where(r => r.ReportType == type.Value);
        if (!string.IsNullOrWhiteSpace(category)) results = results.Where(r => r.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(color)) results = results.Where(r => r.Color.Equals(color, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(location)) results = results.Where(r => r.Location.Contains(location, StringComparison.OrdinalIgnoreCase));
        if (from.HasValue) results = results.Where(r => r.ReportDate.Date >= from.Value.Date);
        if (to.HasValue) results = results.Where(r => r.ReportDate.Date <= to.Value.Date);
        if (!string.IsNullOrWhiteSpace(q))
        {
            results = results.Where(r =>
                r.ItemName.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                r.Description.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                r.ReferenceCode.Contains(q, StringComparison.OrdinalIgnoreCase));
        }

        // Redact HiddenDetails in public listings (CMM-31 / privacy rule)
        return Ok(results.Select(r => new
        {
            r.ReportId,
            r.ReferenceCode,
            r.UserId,
            r.ItemName,
            r.Category,
            r.Color,
            r.ReportType,
            r.Location,
            r.ReportDate,
            r.Description,
            r.VerificationQuestion,
            r.ImagePath,
            r.Status
        }));
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateReportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ItemName) ||
            string.IsNullOrWhiteSpace(request.Category) ||
            string.IsNullOrWhiteSpace(request.Location))
        {
            return BadRequest(new { error = "ItemName, Category, and Location are required." });
        }

        var created = store.AddReport(request);
        return Created($"/api/reports/{created.ReportId}", created);
    }
}
