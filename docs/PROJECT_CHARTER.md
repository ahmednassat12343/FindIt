# FindIt67 — Project Charter & Process Model

Covers Jira tasks [`CMM-3`](https://attendance-management-system.atlassian.net/browse/CMM-3), [`CMM-33`](https://attendance-management-system.atlassian.net/browse/CMM-33), [`CMM-34`](https://attendance-management-system.atlassian.net/browse/CMM-34), [`CMM-35`](https://attendance-management-system.atlassian.net/browse/CMM-35), and [`CMM-37`](https://attendance-management-system.atlassian.net/browse/CMM-37).

---

## 1. Project Name & Description (`CMM-33`)

- **Project Name:** **FindIt** (Jira Workspace: **FindIt67** / Key: `CMM`)
- **Tagline:** *Lost Something? Find It!*
- **Problem Statement:** Students, employees, and visitors frequently lose personal items (laptop bags, wallets, phones, ID cards, keys) across university campuses, institutions, and public venues. Scattered social media posts make discovery difficult, and publicly posting sensitive item details creates opportunities for false ownership claims.
- **Proposed Solution:** A centralized web-based Lost & Found platform that unifies Lost and Found reporting, structured keyword/attribute search, rule-based potential match suggestions, and admin-moderated ownership verification before item handoff.

---

## 2. Customized vs. General Software (`CMM-34`)

- **Classification:** **General / Packaged Product Concept with Custom Domain Implementation**
  - Designed as a reusable Lost & Found system adaptable to multiple organizations and campuses (not hard-coded to a single customer), with the initial deployment focused on a university campus environment.
  - Implemented as custom software so privacy rules (hiding verification details on found reports), deterministic matching weights, and campus-specific workflows can be tailored directly to team requirements.

---

## 3. Software Type (`CMM-35`)

- **Type:** **Web-Based Information & Workflow Management System**
  - **Client Tier:** Responsive HTML, CSS, and JavaScript web application.
  - **Application Tier:** RESTful Web API (`C# / ASP.NET Core`) encapsulating authentication, reporting, search, smart matching, claim review, and notifications.
  - **Data Tier:** Relational database (`SQL Server`) managing users, items, reports, images, claims, notifications, and optional finder–owner messages.

---

## 4. Target Users & System Roles

| Role | Responsibilities |
|---|---|
| **User** (Student / Staff / Visitor) | Register/login, create Lost or Found reports, search & filter reports, receive match notifications, submit ownership claims with private verification answers, track claim status. |
| **Admin** | Manage user accounts and roles, inspect and moderate suspicious reports, review claim verification answers, approve/reject claims, and monitor open/matched/recovered statistics. |
| **Moderator** *(optional / merged with Admin in MVP)* | Assist in verifying item ownership and flagging invalid listings. |

---

## 5. Process Model (`CMM-37`)

### Selected Methodology: **Agile (Scrum)**

FindIt67 follows an **iterative Agile Scrum process** with time-boxed sprints, prioritized user stories, and continuous Jira–GitHub traceability:

1. **Product Backlog & Estimation:**
   - Features are broken down into Epics (`CMM-25` MVP + layer Epics `CMM-20`–`CMM-24`), User Stories (`US01`–`US08`), and technical Subtasks.
   - Effort is estimated collaboratively using **Planning Poker** (`1, 2, 3, 5, 8, 13` story points).
2. **Sprint Structure:**
   - **Sprint 1 — Design and first features (`active`):** Architecture & wireframes (`CMM-36`), user registration/auth (`CMM-27`), report creation + image upload (`CMM-28`), and admin dashboard (`CMM-32`).
   - **Sprint 3 — Additional Features (`planned`):** Search & filtering (`CMM-29`), rule-based smart matching (`CMM-30`), unique reference/QR codes (`CMM-43`), notifications (`CMM-38`), and messaging (`CMM-41`).
   - **Sprint 4 — Last testing and pitching (`planned`):** Ownership claim verification (`CMM-31`) and final documentation, QA verification, and presentation (`CMM-3`).
3. **Why Scrum Fits FindIt67:**
   - Delivers a working vertical **MVP** early (reporting + search + matching + claims) before optional enhancements.
   - Allows priorities and matching rules to be refined based on sprint reviews and edge-case testing (`CMM-58`).
   - Provides clear sprint tracking through **Jira Boards**, **Burn-Down Charts** (`CMM-40`), and mandatory `CMM-*` commit keys.
