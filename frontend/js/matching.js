// Shared deterministic Rule-Based Smart Matching & Filtering Engine (CMM-30, CMM-51, CMM-53, CMM-56, CMM-57, CMM-58, CMM-73)

export const MINIMUM_MATCH_SCORE = 45;

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'near', 'from', 'inside', 'lost', 'found',
  'item', 'my', 'a', 'an', 'in', 'at', 'on', 'of', 'to', 'by'
]);

export function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function tokenize(text) {
  const clean = normalizeText(text).replace(/[^a-z0-9\s]/g, ' ');
  return new Set(
    clean
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t))
  );
}

export function generateReferenceCode(id, year = new Date().getUTCFullYear()) {
  const padded = String(id).padStart(4, '0');
  return `FND-${year}-${padded}`;
}

export function scoreLocation(locA, locB) {
  const na = normalizeText(locA);
  const nb = normalizeText(locB);
  if (!na || !nb) return 0;
  if (na === nb) return 20;
  if (na.includes(nb) || nb.includes(na)) return 15;

  const tokensA = tokenize(na);
  const tokensB = tokenize(nb);
  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }
  return overlap > 0 ? 10 : 0;
}

export function scoreDateProximity(dateA, dateB) {
  const msA = Date.parse(dateA);
  const msB = Date.parse(dateB);
  if (Number.isNaN(msA) || Number.isNaN(msB)) return 0;
  const days = Math.abs(msA - msB) / (1000 * 60 * 60 * 24);
  if (days <= 1) return 15;
  if (days <= 3) return 10;
  if (days <= 7) return 5;
  return 0;
}

export function scoreKeywords(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }
  return Math.min(overlap * 5, 10);
}

export function scorePair(reportA, reportB) {
  const reasons = [];

  const categoryMatch =
    normalizeText(reportA.category) !== '' &&
    normalizeText(reportA.category) === normalizeText(reportB.category);
  const categoryPoints = categoryMatch ? 35 : 0;
  if (categoryPoints > 0) reasons.push(`Same category (${reportA.category})`);

  const colorMatch =
    normalizeText(reportA.color) !== '' &&
    normalizeText(reportA.color) === normalizeText(reportB.color);
  const colorPoints = colorMatch ? 20 : 0;
  if (colorPoints > 0) reasons.push(`Matching color (${reportA.color})`);

  const locationPoints = scoreLocation(reportA.location, reportB.location);
  if (locationPoints > 0) reasons.push(`Location overlap (${reportB.location})`);

  const datePoints = scoreDateProximity(reportA.reportDate, reportB.reportDate);
  if (datePoints > 0) reasons.push('Within matching date window');

  const keywordPoints = scoreKeywords(
    `${reportA.itemName} ${reportA.description}`,
    `${reportB.itemName} ${reportB.description}`
  );
  if (keywordPoints > 0) reasons.push('Shared item/description keywords');

  // CMM-58 / BUG-001 guardrail:
  // Color alone must not produce a potential match without category or 2+ corroborating signals.
  const nonColorSignals =
    (categoryPoints > 0 ? 1 : 0) +
    (locationPoints > 0 ? 1 : 0) +
    (keywordPoints > 0 ? 1 : 0);

  const rawScore = categoryPoints + colorPoints + locationPoints + datePoints + keywordPoints;
  const score =
    categoryPoints === 0 && nonColorSignals < 2
      ? Math.min(rawScore, 30)
      : Math.min(rawScore, 100);

  const confidenceLabel =
    score >= 75
      ? 'Strong Potential Match'
      : score >= MINIMUM_MATCH_SCORE
        ? 'Potential Match'
        : 'Low Similarity';

  return {
    candidateReport: reportB,
    score,
    confidenceLabel,
    breakdown: {
      categoryPoints,
      colorPoints,
      locationPoints,
      datePoints,
      keywordPoints
    },
    reasons
  };
}

export function findMatches(sourceReport, allReports, minScore = MINIMUM_MATCH_SCORE) {
  if (!sourceReport || sourceReport.status === 'Recovered' || sourceReport.status === 'Removed') {
    return [];
  }

  const targetType = sourceReport.reportType === 'Lost' ? 'Found' : 'Lost';

  return allReports
    .filter((r) => r.reportId !== sourceReport.reportId)
    .filter((r) => r.reportType === targetType)
    .filter((r) => r.status !== 'Recovered' && r.status !== 'Removed')
    .map((candidate) => scorePair(sourceReport, candidate))
    .filter((match) => match.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

export function filterReports(reports, filters = {}) {
  const q = normalizeText(filters.q);
  const type = normalizeText(filters.type);
  const category = normalizeText(filters.category);
  const color = normalizeText(filters.color);
  const location = normalizeText(filters.location);
  const fromMs = filters.from ? Date.parse(filters.from) : NaN;
  const toMs = filters.to ? Date.parse(filters.to) : NaN;

  return reports.filter((r) => {
    if (r.status === 'Removed') return false;
    if (type && type !== 'all' && normalizeText(r.reportType) !== type) return false;
    if (category && category !== 'all' && normalizeText(r.category) !== category) return false;
    if (color && normalizeText(r.color) !== color) return false;
    if (location && !normalizeText(r.location).includes(location)) return false;

    const reportMs = Date.parse(r.reportDate);
    if (!Number.isNaN(fromMs) && !Number.isNaN(reportMs) && reportMs < fromMs) return false;
    if (!Number.isNaN(toMs) && !Number.isNaN(reportMs) && reportMs > toMs + 86399999) return false;

    if (q) {
      const haystack = normalizeText(`${r.referenceCode} ${r.itemName} ${r.category} ${r.color} ${r.location} ${r.description}`);
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
