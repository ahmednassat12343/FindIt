using FindIt.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FindIt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class MatchesController(InMemoryFindItStore store, SmartMatchingService matcher) : ControllerBase
{
    [HttpGet("{reportId:int}")]
    public IActionResult GetMatches(int reportId)
    {
        var source = store.GetReport(reportId);
        if (source is null) return NotFound(new { error = $"Report {reportId} not found." });

        var candidates = matcher.FindMatches(source, store.GetReports());
        return Ok(new
        {
            sourceReportId = source.ReportId,
            sourceReferenceCode = source.ReferenceCode,
            matches = candidates.Select(m => new
            {
                m.CandidateReport.ReportId,
                m.CandidateReport.ReferenceCode,
                m.CandidateReport.ItemName,
                m.CandidateReport.Category,
                m.CandidateReport.Color,
                m.CandidateReport.ReportType,
                m.CandidateReport.Location,
                m.CandidateReport.ReportDate,
                m.Score,
                m.ConfidenceLabel,
                m.Breakdown,
                m.Reasons
            })
        });
    }
}
