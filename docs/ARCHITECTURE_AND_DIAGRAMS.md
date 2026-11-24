# System Architecture & Diagrams

Covers Jira tasks [`CMM-36`](https://attendance-management-system.atlassian.net/browse/CMM-36), [`CMM-68`](https://attendance-management-system.atlassian.net/browse/CMM-68), [`CMM-69`](https://attendance-management-system.atlassian.net/browse/CMM-69), and [`CMM-70`](https://attendance-management-system.atlassian.net/browse/CMM-70).

---

## 1. Three-Tier Architecture

```mermaid
flowchart LR
    U["User / Admin Browser"] -->|"HTTPS / JSON"| FE["Frontend (HTML / CSS / JS)"]
    FE -->|"REST API Calls"| API["Backend API (C# / ASP.NET Core)"]
    API -->|"Rule-Based Scoring"| MATCH["SmartMatchingService (CMM-30)"]
    API -->|"Parameterized Queries"| DB[("SQL Server Database")]
    API -->|"Store / Serve Photos"| IMG["Image Upload Storage"]
```

---

## 2. End-to-End Activity Flow (`CMM-68`)

```mermaid
flowchart TD
    A["1. Student loses laptop bag & logs in"] --> B["2. Submits Lost Report (item, location, date)"]
    B --> C["3. System creates Lost Report + unique ID/QR"]
    D["4. Finder submits Found Report (public summary, private details hidden)"] --> E["5. SmartMatchingService scores Lost vs Found"]
    C --> E
    E -->|"Score >= Threshold"| F["6. Potential Match Notification sent to Owner"]
    F --> G["7. Owner submits Claim + hidden detail answers"]
    G --> H["8. Admin reviews private claim answers"]
    H -->|"Approved"| I["9. Safe handoff instructions sent; status = Recovered"]
    H -->|"Rejected"| J["10. Claim status = Rejected; report stays Open"]
```

---

## 3. Data Flow Diagram — Level 0 (`CMM-69`)

```mermaid
flowchart LR
    User["User (Owner / Finder)"] -->|"Registration, Reports, Search, Claims"| System(("FindIt67 Web System"))
    System -->|"Search Results, Match Alerts, Claim Status"| User
    Admin["Admin / Moderator"] -->|"Claim Decisions, Report Moderation"| System
    System -->|"Pending Claims, Reports, System Stats"| Admin
```

---

## 4. Entity-Relationship Diagram (`CMM-69`)

```mermaid
erDiagram
    USERS ||--o{ REPORTS : creates
    ITEMS ||--o{ REPORTS : categorizes
    REPORTS ||--o{ IMAGES : has
    REPORTS ||--o{ CLAIMS : receives
    USERS ||--o{ CLAIMS : submits
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ MESSAGES : receives

    USERS {
        int UserID PK
        nvarchar Name
        nvarchar Email
        nvarchar PasswordHash
        nvarchar Role
    }
    ITEMS {
        int ItemID PK
        nvarchar ItemName
        nvarchar Category
        nvarchar Color
    }
    REPORTS {
        int ReportID PK
        nvarchar ReferenceCode
        int UserID FK
        int ItemID FK
        nvarchar ReportType
        nvarchar Location
        datetime2 ReportDate
        nvarchar Description
        nvarchar HiddenDetails
        nvarchar Status
    }
    IMAGES {
        int ImageID PK
        int ReportID FK
        nvarchar ImagePath
    }
    CLAIMS {
        int ClaimID PK
        int ReportID FK
        int UserID FK
        nvarchar VerificationAnswer
        nvarchar ClaimStatus
        datetime2 SubmittedAt
    }
    NOTIFICATIONS {
        int NotificationID PK
        int UserID FK
        nvarchar Message
        bit IsRead
    }
    MESSAGES {
        int MessageID PK
        int SenderID FK
        int ReceiverID FK
        int ReportID FK
        nvarchar Content
        datetime2 SentAt
    }
```

---

## 5. Core Screen Inventory (`CMM-70`)

1. **Home** — Platform overview, quick navigation, and live counters
2. **Login / Register** — Account creation and sign-in
3. **User Dashboard** — Summary of user reports, potential matches, and claims
4. **Report Lost Item** — Lost item form + optional photo & contact preference
5. **Report Found Item** — Public summary fields + private verification clues hidden from public search
6. **Search & Filter Items** — Keyword, report type, category, color, location, and date range filters
7. **Item Details & Match View** — Public item overview, reference/QR code, and candidate smart matches
8. **My Reports** — Manage user's own lost/found submissions
9. **Claims / Recovery Requests** — Submit ownership claim with hidden verification questions
10. **Notifications** — Potential match alerts and claim review status updates
11. **Admin Dashboard** — Moderate reports, manage users/roles, approve/reject claims, and inspect stats (`Open` / `Matched` / `Recovered`)
