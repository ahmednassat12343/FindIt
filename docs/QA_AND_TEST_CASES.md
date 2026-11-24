# QA Scenarios, Test Cases & Defect Reports

Covers Jira tasks [`CMM-44`](https://attendance-management-system.atlassian.net/browse/CMM-44), [`CMM-45`](https://attendance-management-system.atlassian.net/browse/CMM-45), and [`CMM-58`](https://attendance-management-system.atlassian.net/browse/CMM-58).

---

## 1. Core Test Scenarios (`CMM-44`)

1. **Create Lost Report:** Authenticated user enters valid item details and submits a lost report -> report is saved with status `Open` and assigned a unique reference code.
2. **Smart Matching Candidate Detection (`CMM-30` / `CMM-58`):** Matching Lost and Found reports exist with aligned category, color, location, and date window -> system suggests a **Potential Match** with a transparent score breakdown without claiming 100% certainty.
3. **Ownership Verification Workflow (`CMM-31`):** Claimant selects a found report, answers hidden verification questions, and submits a claim -> Admin reviews and updates claim status to `Approved` or `Rejected`.

---

## 2. Test Cases

| Test ID | Description | Expected Result | Automated Coverage |
|---|---|---|---|
| **TC-001** | Register user with valid name, email, and password | User account is created with `User` role | Planned API test |
| **TC-002** | Submit valid Lost report | Report created with unique `ReferenceCode` (`FND-...`) and `Open` status | `tests/matching.test.mjs` |
| **TC-003** | Search reports for an existing item by keyword/category | Relevant matching reports appear in filtered results | `tests/matching.test.mjs` |
| **TC-004** | Submit ownership claim missing required verification answer | Validation error prompts user before submission | Form validation + `tests/matching.test.mjs` |
| **TC-005** | Admin rejects an unverified ownership claim | Claim status updates to `Rejected`; report remains open | `tests/matching.test.mjs` |
| **TC-006** | *Edge Case (`CMM-58`):* Two items share **only color** (different category, location, and distant dates) | Score remains below match threshold; **not** suggested as a match | `tests/matching.test.mjs` |
| **TC-007** | *Edge Case (`CMM-58`):* Same report type (`Lost` vs `Lost`) or already `Recovered` report | Excluded from potential match suggestions | `tests/matching.test.mjs` |

---

## 3. Sample Defect Report (`CMM-45`)

| Field | Details |
|---|---|
| **Defect ID** | `BUG-001` |
| **Title** | Matching engine suggests unrelated items when only color matches |
| **Severity / Priority** | Medium / High |
| **Linked Jira Task** | `CMM-58` |
| **Steps to Reproduce** | 1. Create a `Lost` report for a *Black Wallet* at *Building A*.<br>2. Create a `Found` report for a *Black Umbrella* at *Gate 3* 20 days earlier.<br>3. Run matching. |
| **Expected Result** | No strong potential match is suggested when only `Color` matches without category or keyword/location alignment. |
| **Actual Result (Pre-fix)** | Color points alone pushed unrelated items into suggestions. |
| **Resolution & Status** | Guardrail added in `SmartMatchingService` / `matching.js`: require `Category` match OR (>= 2 signals including location/keyword/date proximity) and minimum score `>= 45`. Verified by `TC-006`. |
