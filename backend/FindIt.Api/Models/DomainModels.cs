namespace FindIt.Api.Models;

public enum ReportType
{
    Lost,
    Found
}

public enum ReportStatus
{
    Open,
    Matched,
    Claimed,
    Recovered,
    Removed
}

public enum ClaimStatus
{
    Pending,
    Approved,
    Rejected
}

public sealed record UserRecord(
    int UserId,
    string Name,
    string Email,
    string PasswordHash,
    string Role,
    DateTime CreatedAt);

public sealed record ReportRecord(
    int ReportId,
    string ReferenceCode,
    int UserId,
    string ItemName,
    string Category,
    string Color,
    ReportType ReportType,
    string Location,
    DateTime ReportDate,
    string Description,
    string? VerificationQuestion,
    string? HiddenDetails,
    string? ImagePath,
    ReportStatus Status,
    DateTime CreatedAt);

public sealed record ClaimRecord(
    int ClaimId,
    int ReportId,
    int UserId,
    string VerificationAnswer,
    ClaimStatus ClaimStatus,
    string? AdminNote,
    DateTime SubmittedAt,
    DateTime? ReviewedAt);

public sealed record NotificationRecord(
    int NotificationId,
    int UserId,
    string Message,
    bool IsRead,
    DateTime CreatedAt);

public sealed record MatchScoreBreakdown(
    int CategoryPoints,
    int ColorPoints,
    int LocationPoints,
    int DatePoints,
    int KeywordPoints);

public sealed record MatchCandidate(
    ReportRecord CandidateReport,
    int Score,
    string ConfidenceLabel,
    MatchScoreBreakdown Breakdown,
    IReadOnlyList<string> Reasons);

public sealed record RegisterRequest(string Name, string Email, string Password);
public sealed record LoginRequest(string Email, string Password);
public sealed record CreateReportRequest(
    int UserId,
    string ItemName,
    string Category,
    string Color,
    ReportType ReportType,
    string Location,
    DateTime ReportDate,
    string Description,
    string? VerificationQuestion,
    string? HiddenDetails,
    string? ImagePath);

public sealed record CreateClaimRequest(int ReportId, int UserId, string VerificationAnswer);
public sealed record ReviewClaimRequest(ClaimStatus Decision, string? AdminNote);
