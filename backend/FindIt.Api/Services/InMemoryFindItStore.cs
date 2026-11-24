using System.Security.Cryptography;
using System.Text;
using FindIt.Api.Models;

namespace FindIt.Api.Services;

public sealed class InMemoryFindItStore
{
    private readonly object _lock = new();
    private readonly List<UserRecord> _users = [];
    private readonly List<ReportRecord> _reports = [];
    private readonly List<ClaimRecord> _claims = [];
    private readonly List<NotificationRecord> _notifications = [];

    public InMemoryFindItStore()
    {
        Seed();
    }

    public IReadOnlyList<ReportRecord> GetReports()
    {
        lock (_lock) return _reports.ToList();
    }

    public ReportRecord? GetReport(int id)
    {
        lock (_lock) return _reports.FirstOrDefault(r => r.ReportId == id);
    }

    public ReportRecord AddReport(CreateReportRequest req)
    {
        lock (_lock)
        {
            var id = _reports.Count + 1;
            var code = $"FND-{DateTime.UtcNow.Year}-{id:D4}";
            var record = new ReportRecord(
                id,
                code,
                req.UserId,
                req.ItemName.Trim(),
                req.Category.Trim(),
                req.Color.Trim(),
                req.ReportType,
                req.Location.Trim(),
                req.ReportDate,
                req.Description.Trim(),
                req.VerificationQuestion?.Trim(),
                req.HiddenDetails?.Trim(),
                req.ImagePath?.Trim(),
                ReportStatus.Open,
                DateTime.UtcNow);
            _reports.Add(record);
            return record;
        }
    }

    public UserRecord? Authenticate(string email, string password)
    {
        var hash = HashPassword(password);
        lock (_lock)
        {
            return _users.FirstOrDefault(u =>
                u.Email.Equals(email.Trim(), StringComparison.OrdinalIgnoreCase) &&
                u.PasswordHash == hash);
        }
    }

    public (bool Ok, string? Error, UserRecord? User) Register(RegisterRequest req)
    {
        lock (_lock)
        {
            if (_users.Any(u => u.Email.Equals(req.Email.Trim(), StringComparison.OrdinalIgnoreCase)))
                return (false, "An account with this email already exists.", null);

            var user = new UserRecord(
                _users.Count + 1,
                req.Name.Trim(),
                req.Email.Trim().ToLowerInvariant(),
                HashPassword(req.Password),
                "User",
                DateTime.UtcNow);
            _users.Add(user);
            return (true, null, user);
        }
    }

    public ClaimRecord AddClaim(CreateClaimRequest req)
    {
        lock (_lock)
        {
            var claim = new ClaimRecord(
                _claims.Count + 1,
                req.ReportId,
                req.UserId,
                req.VerificationAnswer.Trim(),
                ClaimStatus.Pending,
                null,
                DateTime.UtcNow,
                null);
            _claims.Add(claim);
            AddNotificationUnsafe(req.UserId, $"Claim #{claim.ClaimId} submitted for review.");
            return claim;
        }
    }

    public ClaimRecord? ReviewClaim(int claimId, ReviewClaimRequest req)
    {
        lock (_lock)
        {
            var idx = _claims.FindIndex(c => c.ClaimId == claimId);
            if (idx < 0) return null;

            var existing = _claims[idx];
            var updated = existing with
            {
                ClaimStatus = req.Decision,
                AdminNote = req.AdminNote?.Trim(),
                ReviewedAt = DateTime.UtcNow
            };
            _claims[idx] = updated;

            if (req.Decision == ClaimStatus.Approved)
            {
                var rIdx = _reports.FindIndex(r => r.ReportId == existing.ReportId);
                if (rIdx >= 0)
                    _reports[rIdx] = _reports[rIdx] with { Status = ReportStatus.Recovered };
            }

            AddNotificationUnsafe(existing.UserId, $"Claim #{claimId} was {req.Decision}.");
            return updated;
        }
    }

    public IReadOnlyList<ClaimRecord> GetClaims()
    {
        lock (_lock) return _claims.ToList();
    }

    public IReadOnlyList<NotificationRecord> GetNotifications(int userId)
    {
        lock (_lock) return _notifications.Where(n => n.UserId == userId).ToList();
    }

    private void AddNotificationUnsafe(int userId, string message)
    {
        _notifications.Add(new NotificationRecord(_notifications.Count + 1, userId, message, false, DateTime.UtcNow));
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }

    private void Seed()
    {
        _users.Add(new UserRecord(1, "Ahmad Mansour", "ahmad@findit.edu", HashPassword("Demo1234!"), "User", DateTime.UtcNow));
        _users.Add(new UserRecord(2, "Admin Moderator", "admin@findit.edu", HashPassword("Admin1234!"), "Admin", DateTime.UtcNow));

        _reports.Add(new ReportRecord(
            1, "FND-2026-0001", 1, "Black Laptop Backpack", "Bags", "Black",
            ReportType.Lost, "Engineering Building A", DateTime.UtcNow.AddDays(-1),
            "15-inch Dell laptop inside black nylon backpack with silver zipper tag.",
            null, null, null, ReportStatus.Open, DateTime.UtcNow));

        _reports.Add(new ReportRecord(
            2, "FND-2026-0002", 2, "Black Backpack", "Bags", "Black",
            ReportType.Found, "Engineering Building A", DateTime.UtcNow,
            "Found black backpack near main lecture hall.",
            "What sticker or keychain is on the front pocket?", "Blue university lanyard inside pocket",
            null, ReportStatus.Open, DateTime.UtcNow));
    }
}
