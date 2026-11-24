using System.Text.RegularExpressions;
using FindIt.Api.Models;

namespace FindIt.Api.Services;

/// <summary>
/// Deterministic rule-based matching engine for Lost and Found reports (CMM-30, CMM-56, CMM-57, CMM-58).
/// Scores category, color, location, date proximity, and description keywords without external AI.
/// </summary>
public sealed class SmartMatchingService
{
    public const int MinimumMatchScore = 45;

    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "the", "and", "for", "with", "near", "from", "inside", "lost", "found", "item", "my", "a", "an", "in", "at", "on"
    };

    public IReadOnlyList<MatchCandidate> FindMatches(
        ReportRecord source,
        IEnumerable<ReportRecord> allReports,
        int minScore = MinimumMatchScore)
    {
        if (source.Status is ReportStatus.Recovered or ReportStatus.Removed)
            return [];

        var targetType = source.ReportType == ReportType.Lost ? ReportType.Found : ReportType.Lost;

        return allReports
            .Where(r => r.ReportId != source.ReportId)
            .Where(r => r.ReportType == targetType)
            .Where(r => r.Status is not (ReportStatus.Recovered or ReportStatus.Removed))
            .Select(candidate => ScorePair(source, candidate))
            .Where(match => match.Score >= minScore)
            .OrderByDescending(match => match.Score)
            .ThenByDescending(match => match.CandidateReport.ReportDate)
            .ToList();
    }

    public MatchCandidate ScorePair(ReportRecord a, ReportRecord b)
    {
        var reasons = new List<string>();

        var categoryPoints = Normalize(a.Category) == Normalize(b.Category) && !string.IsNullOrEmpty(a.Category) ? 35 : 0;
        if (categoryPoints > 0) reasons.Add($"Same category ({a.Category})");

        var colorPoints = Normalize(a.Color) == Normalize(b.Color) && !string.IsNullOrEmpty(a.Color) ? 20 : 0;
        if (colorPoints > 0) reasons.Add($"Matching color ({a.Color})");

        var locationPoints = ScoreLocation(a.Location, b.Location);
        if (locationPoints > 0) reasons.Add($"Location overlap ({b.Location})");

        var datePoints = ScoreDateProximity(a.ReportDate, b.ReportDate);
        if (datePoints > 0) reasons.Add("Within matching date window");

        var keywordPoints = ScoreKeywords(
            $"{a.ItemName} {a.Description}",
            $"{b.ItemName} {b.Description}");
        if (keywordPoints > 0) reasons.Add("Shared item/description keywords");

        // CMM-58 / BUG-001 edge-case guardrail:
        // Prevent color-only matches from crossing the suggestion threshold without domain corroboration.
        var nonColorSignals = (categoryPoints > 0 ? 1 : 0)
                            + (locationPoints > 0 ? 1 : 0)
                            + (keywordPoints > 0 ? 1 : 0);

        var rawScore = categoryPoints + colorPoints + locationPoints + datePoints + keywordPoints;
        var finalScore = (categoryPoints == 0 && nonColorSignals < 2) ? Math.Min(rawScore, 30) : Math.Min(rawScore, 100);

        var label = finalScore >= 75 ? "Strong Potential Match"
                  : finalScore >= MinimumMatchScore ? "Potential Match"
                  : "Low Similarity";

        return new MatchCandidate(
            b,
            finalScore,
            label,
            new MatchScoreBreakdown(categoryPoints, colorPoints, locationPoints, datePoints, keywordPoints),
            reasons);
    }

    private static int ScoreLocation(string locA, string locB)
    {
        var na = Normalize(locA);
        var nb = Normalize(locB);
        if (string.IsNullOrEmpty(na) || string.IsNullOrEmpty(nb)) return 0;
        if (na == nb) return 20;
        if (na.Contains(nb, StringComparison.Ordinal) || nb.Contains(na, StringComparison.Ordinal)) return 15;

        var tokensA = Tokenize(na);
        var tokensB = Tokenize(nb);
        var overlap = tokensA.Intersect(tokensB, StringComparer.Ordinal).Count();
        return overlap > 0 ? 10 : 0;
    }

    private static int ScoreDateProximity(DateTime d1, DateTime d2)
    {
        var days = Math.Abs((d1.Date - d2.Date).TotalDays);
        return days switch
        {
            <= 1 => 15,
            <= 3 => 10,
            <= 7 => 5,
            _ => 0
        };
    }

    private static int ScoreKeywords(string textA, string textB)
    {
        var tokensA = Tokenize(textA);
        var tokensB = Tokenize(textB);
        var overlap = tokensA.Intersect(tokensB, StringComparer.Ordinal).Count();
        return Math.Min(overlap * 5, 10);
    }

    private static string Normalize(string? value) =>
        (value ?? string.Empty).Trim().ToLowerInvariant();

    private static HashSet<string> Tokenize(string? text)
    {
        var clean = Regex.Replace(Normalize(text), @"[^a-z0-9\s]", " ");
        return clean
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= 3 && !StopWords.Contains(t))
            .ToHashSet(StringComparer.Ordinal);
    }
}
