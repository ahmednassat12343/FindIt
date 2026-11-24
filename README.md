# FindIt67 — Lost & Found Web System

**Lost Something? Find It!**

`FindIt67` is a centralized web platform that helps students, staff, and visitors report lost or found items, search and filter reports, receive rule-based smart match suggestions, and recover belongings through a secure ownership-verification workflow.

- **Jira Project:** [`CMM` (FindIt67)](https://attendance-management-system.atlassian.net/jira/software/projects/CMM/boards/1)
- **GitHub Repository:** [`ahmednassat12343/FindIt`](https://github.com/ahmednassat12343/FindIt)

---

## Core Features

### MVP Scope (`CMM-25`)
- **User Authentication & Profile Management (`CMM-27`):** Register, log in, edit profile, and track submitted reports and claims.
- **Lost & Found Reports with Image Upload (`CMM-28`):** Submit lost or found reports with item name, category, color, location, date, description, and optional image upload while keeping private verification details hidden on public found listings.
- **Search & Multi-Criteria Filtering (`CMM-29`):** Search reports by keywords and filter by report type (`Lost`/`Found`), category, color, location, and date range.
- **Rule-Based Smart Matching System (`CMM-30`):** Deterministic scoring engine comparing category, color, location, date window, and description keywords to surface ranked *Potential Match* candidates without false positives.
- **Ownership Claim & Admin Verification (`CMM-31`):** Claimants submit ownership requests with hidden-detail answers; admins review, approve, or reject claims and coordinate safe handoff before marking items `Recovered`.
- **Admin Dashboard (`CMM-32`):** Manage users/roles, moderate suspicious or duplicate reports, review claims, and view live open/matched/recovered statistics.

### Additional Features
- **Automated Match & Claim Notifications (`CMM-38`):** Notify users when potential matches appear or claim statuses change.
- **In-App Finder–Owner Messaging (`CMM-41`):** Direct communication thread once an ownership claim is verified.
- **Unique Report Reference / QR Codes (`CMM-43`):** Generate unique tracking IDs (e.g. `FND-2026-0001`) and QR payloads per report.

---

## Repository Structure

```text
FindIt/
├── README.md
├── .gitignore
├── docs/
│   ├── PROJECT_CHARTER.md              # CMM-33, CMM-34, CMM-35, CMM-37 (Process Model)
│   ├── USER_STORIES_AND_PLANNING.md    # CMM-39, CMM-40, CMM-42
│   ├── ARCHITECTURE_AND_DIAGRAMS.md    # CMM-36, CMM-68, CMM-69, CMM-70
│   └── QA_AND_TEST_CASES.md            # CMM-44, CMM-45, CMM-58
├── database/
│   └── schema.sql                      # CMM-46, CMM-59, CMM-62 (SQL Server DDL + seed)
├── backend/
│   └── FindIt.Api/                     # CMM-47, CMM-51, CMM-53, CMM-57, CMM-61, CMM-63
│       ├── FindIt.Api.csproj
│       ├── Program.cs
│       ├── Models/
│       │   └── DomainModels.cs
│       ├── Services/
│       │   └── SmartMatchingService.cs # CMM-30 / CMM-56 / CMM-57
│       └── Controllers/
│           ├── AuthController.cs
│           ├── ReportsController.cs
│           ├── MatchesController.cs
│           └── ClaimsController.cs
├── frontend/                           # CMM-48, CMM-49, CMM-54, CMM-60, CMM-64..67
│   ├── index.html
│   ├── styles.css
│   └── js/
│       ├── matching.js                 # Shared deterministic matching engine (browser + Node)
│       └── app.js
└── tests/
    └── matching.test.mjs               # CMM-58 / CMM-44 automated unit & edge-case tests
```

---

## Jira Sprint & Ownership Map (`CMM`)

| Sprint | Key | Summary | Assignee |
|---|---|---|---|
| **Sprint 1** (`active`) — Design and first features | `CMM-27` | User Registration, Login & Profile Management | mrwan elsafy |
| **Sprint 1** (`active`) | `CMM-28` | Create Lost and Found Reports with Image Upload | Ahmed Mohammed |
| **Sprint 1** (`active`) | `CMM-32` | Admin Dashboard for Managing Reports, Users, and Claims | Ahmed ibrahim mamoun |
| **Sprint 1** (`active`) | `CMM-36` | System Architecture Diagrams & UI Wireframes | Ahmed Mohammed |
| **Sprint 3** (`future`) — Additional Features | `CMM-29` | Search and Filter Lost & Found Reports | mrwan elsafy |
| **Sprint 3** (`future`) | `CMM-30` | Rule-Based Smart Matching System | Ahmad Mohamed Said Mansour |
| **Sprint 3** (`future`) | `CMM-38` | Automated User Notifications for Potential Matches & Status | Zyad Farouk |
| **Sprint 3** (`future`) | `CMM-41` | In-App Messaging Between Finder and Owner | Zyad Farouk |
| **Sprint 3** (`future`) | `CMM-43` | Generate Unique IDCode for Each Report | Zyad Farouk |
| **Sprint 4** (`future`) — Last testing and pitching | `CMM-31` | Ownership Claim Submission and Admin Verification | Ahmed ibrahim mamoun |
| **Sprint 4** (`future`) | `CMM-3` | Documentation (`CMM-33`–`CMM-45`, incl. `CMM-37` Process Model) | Ahmed ibrahim mamoun (lead) |

---

## Getting Started

### 1. Run Smart Matching & Core Logic Tests (Node.js)
```bash
node --test tests/matching.test.mjs
```

### 2. Preview the Frontend Locally
Serve `frontend/` with any static server (e.g. Node or Python):
```bash
python -m http.server 8080 --directory frontend
```
Then open `http://localhost:8080` in your browser.

### 3. Backend (`C# / ASP.NET Core`) & Database (`SQL Server`)
- Run `database/schema.sql` against your SQL Server instance (`FindItDb`).
- Build and run `backend/FindIt.Api` with the .NET 8 SDK:
  ```bash
  dotnet restore backend/FindIt.Api/FindIt.Api.csproj
  dotnet run --project backend/FindIt.Api/FindIt.Api.csproj
  ```

---

## Jira–Git Traceability Rules

Every branch, commit, and pull request must reference its Jira key from project `CMM` so Jira Development tracking links automatically:

- **Branch naming:** `<JIRA-KEY>-<short-slug>` (e.g., `CMM-30-smart-matching`, `CMM-37-process-model`)
- **Commit message:** `<JIRA-KEY>: <concise change summary>` (e.g., `CMM-30: implement rule-based smart matching engine`)
