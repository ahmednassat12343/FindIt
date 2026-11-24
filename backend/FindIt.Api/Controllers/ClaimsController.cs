using FindIt.Api.Models;
using FindIt.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FindIt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ClaimsController(InMemoryFindItStore store) : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(store.GetClaims());

    [HttpPost]
    public IActionResult Create([FromBody] CreateClaimRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.VerificationAnswer))
            return BadRequest(new { error = "Verification answer is required." });

        var report = store.GetReport(request.ReportId);
        if (report is null) return NotFound(new { error = $"Report {request.ReportId} not found." });

        var claim = store.AddClaim(request);
        return Created($"/api/claims/{claim.ClaimId}", claim);
    }

    [HttpPatch("{claimId:int}/review")]
    public IActionResult Review(int claimId, [FromBody] ReviewClaimRequest request)
    {
        if (request.Decision == ClaimStatus.Pending)
            return BadRequest(new { error = "Decision must be Approved or Rejected." });

        var updated = store.ReviewClaim(claimId, request);
        return updated is null ? NotFound() : Ok(updated);
    }
}
