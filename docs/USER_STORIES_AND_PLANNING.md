# User Stories, Planning Poker & Burn-Down Tracking

Covers Jira tasks [`CMM-39`](https://attendance-management-system.atlassian.net/browse/CMM-39), [`CMM-40`](https://attendance-management-system.atlassian.net/browse/CMM-40), and [`CMM-42`](https://attendance-management-system.atlassian.net/browse/CMM-42).

---

## 1. Core User Stories (`CMM-39`)

| ID | Jira Key | User Story | Story Points |
|---|---|---|---|
| **US01** | `CMM-27` | As a user, I want to register and log in so that I can use the FindIt platform securely. | 3 |
| **US02** | `CMM-28` | As a user, I want to report a lost item so that others can help me find it. | 5 |
| **US03** | `CMM-28` | As a user, I want to report a found item so that its rightful owner can reclaim it. | 5 |
| **US04** | `CMM-29` | As a user, I want to search and filter reports so that I can discover potential matches. | 5 |
| **US05** | `CMM-38` | As a user, I want to receive notifications about potential matches and claim status updates. | 3 |
| **US06** | `CMM-31` | As a user, I want to submit an ownership claim with hidden verification details. | 5 |
| **US07** | `CMM-31` | As an admin, I want to review ownership claims and approve or reject them. | 5 |
| **US08** | `CMM-32` | As an admin, I want to manage reports, users, and system statistics from a dashboard. | 3 |

---

## 2. Planning Poker Estimation (`CMM-42`)

- **Scale Used:** Modified Fibonacci (`1, 2, 3, 5, 8, 13`)
- **Total Initial MVP Estimate (`US01`–`US08`):** **34 story points**
- **Guidelines:**
  - `1–2 pts`: Small UI adjustments or static validation rules.
  - `3 pts`: Standard CRUD view, notification trigger, or auth screen.
  - `5 pts`: Multi-layer feature spanning database schema, API endpoints, validation, and UI.
  - `8–13 pts`: Cross-cutting features requiring decomposition before entering a sprint.

---

## 3. Sprint Burn-Down Tracking (`CMM-40`)

Track remaining story points across each sprint day (`Day 1` to `Day 10` for a 2-week sprint):

| Day | Ideal Remaining (pts) | Actual Remaining (pts) | Notes |
|---|---|---|---|
| Day 1 | 30 | 30 | Sprint start & task breakdown |
| Day 2 | 27 | — | Update daily as subtasks move to `Done` |
| Day 3 | 24 | — | |
| Day 4 | 21 | — | |
| Day 5 | 18 | — | Mid-sprint checkpoint |
| Day 6 | 15 | — | |
| Day 7 | 12 | — | |
| Day 8 | 9 | — | |
| Day 9 | 6 | — | |
| Day 10 | 0 | — | Sprint review & retrospective |
