import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MINIMUM_MATCH_SCORE,
  filterReports,
  findMatches,
  generateReferenceCode,
  scorePair
} from '../frontend/js/matching.js';

const baseReports = [
  {
    reportId: 1,
    referenceCode: 'FND-2026-0001',
    itemName: 'Black Laptop Backpack',
    category: 'Bags',
    color: 'Black',
    reportType: 'Lost',
    location: 'Engineering Building A',
    reportDate: '2026-11-23',
    description: '15-inch Dell laptop inside black nylon backpack',
    status: 'Open'
  },
  {
    reportId: 2,
    referenceCode: 'FND-2026-0002',
    itemName: 'Black Backpack',
    category: 'Bags',
    color: 'Black',
    reportType: 'Found',
    location: 'Engineering Building A',
    reportDate: '2026-11-24',
    description: 'Found black backpack near lecture hall',
    status: 'Open'
  },
  {
    reportId: 3,
    referenceCode: 'FND-2026-0003',
    itemName: 'Black Umbrella',
    category: 'Accessories',
    color: 'Black',
    reportType: 'Found',
    location: 'South Gate',
    reportDate: '2026-10-01',
    description: 'Compact folding umbrella',
    status: 'Open'
  },
  {
    reportId: 4,
    referenceCode: 'FND-2026-0004',
    itemName: 'Black Leather Wallet',
    category: 'Wallets',
    color: 'Black',
    reportType: 'Lost',
    location: 'Cafeteria',
    reportDate: '2026-11-24',
    description: 'Lost wallet',
    status: 'Open'
  },
  {
    reportId: 5,
    referenceCode: 'FND-2026-0005',
    itemName: 'Recovered Laptop Bag',
    category: 'Bags',
    color: 'Black',
    reportType: 'Found',
    location: 'Engineering Building A',
    reportDate: '2026-11-24',
    description: 'Black laptop backpack already returned',
    status: 'Recovered'
  }
];

test('CMM-73: generateReferenceCode produces padded FND tracking codes', () => {
  assert.equal(generateReferenceCode(1, 2026), 'FND-2026-0001');
  assert.equal(generateReferenceCode(42, 2026), 'FND-2026-0042');
});

test('CMM-30 / CMM-57: Lost and Found matching backpack produces Strong Potential Match', () => {
  const matches = findMatches(baseReports[0], baseReports);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].candidateReport.reportId, 2);
  assert.ok(matches[0].score >= 75, `Expected score >= 75, got ${matches[0].score}`);
  assert.equal(matches[0].confidenceLabel, 'Strong Potential Match');
});

test('CMM-58 / BUG-001: Color-only match does not cross suggestion threshold', () => {
  const result = scorePair(baseReports[3], baseReports[2]);
  assert.ok(result.score < MINIMUM_MATCH_SCORE, `Color-only score ${result.score} must stay below ${MINIMUM_MATCH_SCORE}`);
  const matches = findMatches(baseReports[3], baseReports);
  assert.equal(matches.length, 0);
});

test('CMM-58: Same-type and Recovered reports are excluded from match results', () => {
  const matches = findMatches(baseReports[0], baseReports);
  const ids = matches.map((m) => m.candidateReport.reportId);
  assert.equal(ids.includes(4), false);
  assert.equal(ids.includes(5), false);
});

test('CMM-51 / CMM-53: filterReports filters by keyword, category, type, location, and date range', () => {
  const byLocation = filterReports(baseReports, { location: 'Library' });
  assert.equal(byLocation.length, 0);

  const bagsFound = filterReports(baseReports, {
    type: 'Found',
    category: 'Bags',
    from: '2026-11-23',
    to: '2026-11-25',
    q: 'backpack'
  });
  assert.deepEqual(
    bagsFound.map((r) => r.reportId),
    [2, 5]
  );
});
