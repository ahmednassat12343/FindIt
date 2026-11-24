import { filterReports, findMatches, generateReferenceCode } from './matching.js';

const state = {
  currentUser: { userId: 1, name: 'Ahmad Mansour', email: 'ahmad@findit.edu', role: 'User' },
  activeClaimReportId: null,
  reports: [
    {
      reportId: 1,
      referenceCode: 'FND-2026-0001',
      userId: 1,
      itemName: 'Black Laptop Backpack',
      category: 'Bags',
      color: 'Black',
      reportType: 'Lost',
      location: 'Engineering Building A',
      reportDate: '2026-11-23',
      description: '15-inch Dell laptop inside black nylon backpack with silver zipper tag.',
      verificationQuestion: null,
      status: 'Open',
      imageUrl: null
    },
    {
      reportId: 2,
      referenceCode: 'FND-2026-0002',
      userId: 2,
      itemName: 'Black Backpack',
      category: 'Bags',
      color: 'Black',
      reportType: 'Found',
      location: 'Engineering Building A',
      reportDate: '2026-11-24',
      description: 'Found black backpack near main lecture hall.',
      verificationQuestion: 'What sticker or keychain is inside the front pocket?',
      status: 'Open',
      imageUrl: null
    },
    {
      reportId: 3,
      referenceCode: 'FND-2026-0003',
      userId: 3,
      itemName: 'Silver Campus Keys',
      category: 'Keys & IDs',
      color: 'Silver',
      reportType: 'Found',
      location: 'Central Library',
      reportDate: '2026-11-24',
      description: 'Keychain with two silver keys and blue tag found at reading desk.',
      verificationQuestion: 'What text or number is printed on the blue keychain tag?',
      status: 'Open',
      imageUrl: null
    }
  ],
  claims: [
    {
      claimId: 1,
      reportId: 2,
      claimantName: 'Ahmad Mansour',
      verificationAnswer: 'Blue university lanyard and Dell charger inside front pocket.',
      claimStatus: 'Pending'
    }
  ],
  notifications: [
    'Potential Match (90/100): FND-2026-0001 matches Found report FND-2026-0002 at Engineering Building A.'
  ]
};

// Accessible validation synchronization per modern-web-guidance (validate-input-after-interaction)
function setupAccessibleValidation() {
  const linkError = (el, shown) => {
    const errorId = el.dataset.error;
    if (!errorId) return;
    const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== errorId);
    if (shown) ids.push(errorId);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  };

  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.classList.add('visually-hidden');
  document.body.append(announcer);

  let announceTimer;
  let announcedField;
  const flagged = new WeakSet();
  const announced = new WeakSet();
  const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
  const dirtyState = new WeakMap();

  const spokenText = (node) => {
    const copy = node.cloneNode(true);
    copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
    copy.querySelectorAll('[role="img"][aria-label]').forEach((n) => n.replaceWith(`${n.getAttribute('aria-label')}: `));
    return copy.textContent.replace(/\s+/g, ' ').trim();
  };

  const announceError = (el) => {
    const error = document.getElementById(el.dataset.error);
    if (!error) return;
    const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : '';
    clearTimeout(announceTimer);
    announcer.textContent = '';
    announcedField = el;
    announceTimer = setTimeout(() => {
      announcer.textContent = label + spokenText(error);
    }, 500);
  };

  const syncControl = (el, announce = false) => {
    if (!el.matches?.('input, select, textarea')) return;
    const invalid = supportsUserInvalid
      ? el.matches(':user-invalid')
      : el.classList.contains('user-invalid-fallback');

    if (invalid) {
      if (announce && !announced.has(el)) {
        announceError(el);
        announced.add(el);
      }
      el.setAttribute('aria-invalid', 'true');
      linkError(el, true);
      flagged.add(el);
    } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
      el.setAttribute('aria-invalid', 'false');
      linkError(el, false);
      flagged.delete(el);
      announced.delete(el);
      if (announcedField === el) {
        clearTimeout(announceTimer);
        announcer.textContent = '';
      }
    }
  };

  document.querySelectorAll('input, select, textarea').forEach((el) => syncControl(el));

  if (!supportsUserInvalid) {
    const updateFallback = (input) => {
      const valid = input.validity.valid;
      input.classList.toggle('user-invalid-fallback', !valid);
      input.classList.toggle('user-valid-fallback', valid);
    };
    document.addEventListener('blur', (e) => {
      if (!e.target.checkValidity) return;
      const st = dirtyState.get(e.target) || { hasInteracted: false, hasBlurred: false };
      st.hasBlurred = true;
      dirtyState.set(e.target, st);
      if (st.hasInteracted) updateFallback(e.target);
    }, true);
    document.addEventListener('input', (e) => {
      if (!e.target.checkValidity) return;
      const st = dirtyState.get(e.target) || { hasInteracted: false, hasBlurred: false };
      st.hasInteracted = true;
      dirtyState.set(e.target, st);
      if (st.hasBlurred) updateFallback(e.target);
    });
    document.addEventListener('invalid', (e) => {
      if (!e.target.checkValidity) return;
      dirtyState.set(e.target, { hasInteracted: true, hasBlurred: true });
      updateFallback(e.target);
    }, true);
  }

  document.addEventListener('blur', (e) => syncControl(e.target, true), true);
  document.addEventListener('input', (e) => {
    if (e.target.hasAttribute('aria-invalid')) syncControl(e.target);
  });
  document.addEventListener('change', (e) => syncControl(e.target, true), true);
  document.addEventListener('invalid', (e) => {
    announced.add(e.target);
    syncControl(e.target);
  }, true);
  document.addEventListener('reset', (e) => {
    setTimeout(() => {
      [...(e.target.elements || [])].forEach((el) => {
        dirtyState.delete(el);
        el.classList.remove('user-invalid-fallback', 'user-valid-fallback');
        syncControl(el);
      });
    });
  }, true);
}

// Native modal dialog light-dismiss fallback per modern-web-guidance
function setupClaimDialog() {
  const dialog = document.getElementById('claim-dialog');
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    let pressedOutside = false;
    const isOutside = (e) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    dialog.addEventListener('pointerdown', (e) => { pressedOutside = isOutside(e); });
    dialog.addEventListener('pointerup', (e) => { if (pressedOutside && isOutside(e)) dialog.close(); });
  }

  dialog.addEventListener('close', () => {
    dialog.returnValue = '';
  });

  document.getElementById('claim-close-btn').addEventListener('click', () => dialog.close());
  document.getElementById('claim-cancel-btn').addEventListener('click', () => dialog.close());

  document.getElementById('claim-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    const answer = form.verificationAnswer.value.trim();
    const report = state.reports.find((r) => r.reportId === state.activeClaimReportId);
    if (!report) return;

    const claimId = state.claims.length + 1;
    state.claims.unshift({
      claimId,
      reportId: report.reportId,
      claimantName: state.currentUser.name,
      verificationAnswer: answer,
      claimStatus: 'Pending'
    });
    state.notifications.unshift(`Claim #${claimId} submitted for ${report.referenceCode} (${report.itemName}).`);
    form.reset();
    dialog.close('submitted');
    renderAll();
  });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function openClaimModal(report) {
  state.activeClaimReportId = report.reportId;
  document.getElementById('claim-report-summary').textContent =
    `${report.referenceCode} • ${report.itemName} (${report.location})`;
  document.getElementById('claim-question-text').textContent =
    report.verificationQuestion || 'Provide specific identifying details known only to the owner.';
  document.getElementById('claim-dialog').showModal();
}

function renderStats() {
  const openCount = state.reports.filter((r) => r.status === 'Open').length;
  const recoveredCount = state.reports.filter((r) => r.status === 'Recovered').length;
  const matchCount = state.reports.reduce((acc, r) => acc + (r.reportType === 'Lost' ? findMatches(r, state.reports).length : 0), 0);

  document.getElementById('stat-open').textContent = String(openCount);
  document.getElementById('stat-matched').textContent = String(matchCount);
  document.getElementById('stat-recovered').textContent = String(recoveredCount);
}

function renderReports() {
  const form = document.getElementById('filter-form');
  const filters = {
    q: form.q.value,
    type: form.type.value,
    category: form.category.value,
    color: form.color.value,
    location: form.location.value,
    from: form.from.value
  };
  const filtered = filterReports(state.reports, filters);
  const container = document.getElementById('reports-grid');
  container.replaceChildren();

  if (filtered.length === 0) {
    container.append(el('p', 'meta-line', 'No reports match the current filters.'));
    return;
  }

  for (const r of filtered) {
    const card = el('article', 'card');
    const top = el('div', 'card-top');
    const pill = el('span', `type-pill ${r.reportType === 'Lost' ? 'is-lost' : 'is-found'}`, r.reportType);
    const ref = el('small', 'meta-line', `${r.referenceCode} • ${r.status}`);
    top.append(pill, ref);

    card.append(top, el('h3', '', r.itemName));
    if (r.imageUrl) {
      const img = el('img', 'card-image');
      img.src = r.imageUrl;
      img.alt = r.itemName;
      card.append(img);
    }
    card.append(
      el('p', 'meta-line', `${r.category} • ${r.color} • ${r.location} • ${r.reportDate}`),
      el('p', '', r.description)
    );

    const actions = el('div', 'card-actions');
    const matchBtn = el('button', 'btn btn-ghost', 'Check Smart Matches');
    matchBtn.type = 'button';
    matchBtn.addEventListener('click', () => {
      document.getElementById('match-source-select').value = String(r.reportId);
      switchView('matches');
      renderMatches();
    });
    actions.append(matchBtn);

    if (r.reportType === 'Found' && r.status !== 'Recovered') {
      const claimBtn = el('button', 'btn btn-accent', 'Claim Ownership');
      claimBtn.type = 'button';
      claimBtn.addEventListener('click', () => openClaimModal(r));
      actions.append(claimBtn);
    }

    card.append(actions);
    container.append(card);
  }
}

function renderMatches() {
  const select = document.getElementById('match-source-select');
  const currentValue = select.value;
  select.replaceChildren();

  for (const r of state.reports) {
    const opt = el('option', '', `${r.referenceCode} (${r.reportType}) — ${r.itemName}`);
    opt.value = String(r.reportId);
    select.append(opt);
  }

  if (currentValue && state.reports.some((r) => String(r.reportId) === currentValue)) {
    select.value = currentValue;
  }

  const source = state.reports.find((r) => String(r.reportId) === select.value) || state.reports[0];
  const list = document.getElementById('matches-list');
  list.replaceChildren();
  if (!source) return;

  const matches = findMatches(source, state.reports);
  if (matches.length === 0) {
    list.append(el('p', 'meta-line', 'No potential matches met the rule-based threshold (>= 45 points) for this report.'));
    return;
  }

  for (const m of matches) {
    const c = m.candidateReport;
    const card = el('article', 'card');
    const top = el('div', 'card-top');
    top.append(
      el('span', 'badge', `${m.score}/100 • ${m.confidenceLabel}`),
      el('small', 'meta-line', c.referenceCode)
    );
    card.append(
      top,
      el('h3', '', `${c.itemName} (${c.reportType})`),
      el('p', 'meta-line', `${c.category} • ${c.color} • ${c.location} • ${c.reportDate}`),
      el('p', '', `Reasons: ${m.reasons.join(' · ')}`)
    );
    if (c.reportType === 'Found' && c.status !== 'Recovered') {
      const claimBtn = el('button', 'btn btn-accent', 'Submit Ownership Claim');
      claimBtn.type = 'button';
      claimBtn.addEventListener('click', () => openClaimModal(c));
      card.append(claimBtn);
    }
    list.append(card);
  }
}

function renderAdmin() {
  const tbody = document.getElementById('claims-table-body');
  tbody.replaceChildren();

  for (const c of state.claims) {
    const report = state.reports.find((r) => r.reportId === c.reportId);
    const tr = document.createElement('tr');
    const idHeader = el('th', '', `CLM-${String(c.claimId).padStart(3, '0')}`);
    idHeader.scope = 'row';

    const actionCell = document.createElement('td');
    if (c.claimStatus === 'Pending') {
      const wrap = el('div', 'card-actions');
      const approveBtn = el('button', 'btn btn-primary', 'Approve');
      approveBtn.type = 'button';
      approveBtn.addEventListener('click', () => {
        c.claimStatus = 'Approved';
        if (report) report.status = 'Recovered';
        state.notifications.unshift(`Claim CLM-${String(c.claimId).padStart(3, '0')} approved; ${report?.referenceCode || ''} marked Recovered.`);
        renderAll();
      });

      const rejectBtn = el('button', 'btn btn-ghost', 'Reject');
      rejectBtn.type = 'button';
      rejectBtn.addEventListener('click', () => {
        c.claimStatus = 'Rejected';
        state.notifications.unshift(`Claim CLM-${String(c.claimId).padStart(3, '0')} rejected.`);
        renderAll();
      });
      wrap.append(approveBtn, rejectBtn);
      actionCell.append(wrap);
    } else {
      actionCell.textContent = 'Reviewed';
    }

    tr.append(
      idHeader,
      el('td', '', report ? `${report.referenceCode} (${report.itemName})` : `#${c.reportId}`),
      el('td', '', c.claimantName),
      el('td', '', c.verificationAnswer),
      el('td', '', c.claimStatus),
      actionCell
    );
    tbody.append(tr);
  }

  const notifList = document.getElementById('notifications-list');
  notifList.replaceChildren();
  for (const msg of state.notifications) {
    notifList.append(el('li', '', msg));
  }
}

function switchView(name) {
  document.querySelectorAll('main > section.panel').forEach((sec) => {
    sec.hidden = sec.id !== `view-${name}`;
  });
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.nav === name);
  });
}

function renderAll() {
  renderStats();
  renderReports();
  renderMatches();
  renderAdmin();
}

function setupInteractions() {
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (btn.tagName === 'A') e.preventDefault();
      switchView(btn.dataset.nav);
    });
  });

  document.getElementById('filter-form').addEventListener('input', renderReports);
  document.getElementById('match-source-select').addEventListener('change', renderMatches);

  document.getElementById('report-date').valueAsDate = new Date();
  document.getElementById('report-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    const id = state.reports.length + 1;
    const file = form.image.files?.[0];
    const newReport = {
      reportId: id,
      referenceCode: generateReferenceCode(id),
      userId: state.currentUser.userId,
      itemName: form.itemName.value.trim(),
      category: form.category.value,
      color: form.color.value.trim(),
      reportType: form.reportType.value,
      location: form.location.value.trim(),
      reportDate: form.reportDate.value,
      description: form.description.value.trim(),
      verificationQuestion: form.verificationQuestion.value.trim() || null,
      status: 'Open',
      imageUrl: file ? URL.createObjectURL(file) : null
    };

    state.reports.unshift(newReport);
    const matches = findMatches(newReport, state.reports);
    if (matches.length > 0) {
      state.notifications.unshift(
        `New ${newReport.reportType} report ${newReport.referenceCode} has ${matches.length} potential match(es).`
      );
    }
    document.getElementById('report-feedback').textContent =
      `Published ${newReport.referenceCode} (${matches.length} potential match(es) detected).`;
    form.reset();
    document.getElementById('report-date').valueAsDate = new Date();
    renderAll();
  });

  document.querySelectorAll('.toggle-pw').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(show));
    });
  });

  document.getElementById('signin-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const email = form.email.value.trim();
    state.currentUser = { userId: 1, name: email.split('@')[0], email, role: 'User' };
    document.getElementById('session-status').textContent = `Signed in: ${state.currentUser.name} (${state.currentUser.role})`;
    document.getElementById('signin-feedback').textContent = `Signed in as ${email}.`;
  });

  document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const name = form['full-name'].value.trim();
    const email = form.email.value.trim();
    state.currentUser = { userId: 99, name, email, role: 'User' };
    document.getElementById('session-status').textContent = `Signed in: ${name} (User)`;
    document.getElementById('signup-feedback').textContent = `Account created for ${name}.`;
    form.reset();
  });
}

setupAccessibleValidation();
setupClaimDialog();
setupInteractions();
renderAll();
