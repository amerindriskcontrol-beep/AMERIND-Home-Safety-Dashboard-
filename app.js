/* Home Ready — AMERIND v2: Redesigned UX */
'use strict';

// ── Utils ──
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── State ──
const state = {
  player: { name: localStorage.getItem('hr_name') || '' },
  badges: JSON.parse(localStorage.getItem('hr_badges') || '[]'),
  progress: JSON.parse(localStorage.getItem('hr_progress') || '{}'),
  contrast: localStorage.getItem('hr_contrast') || 'normal',
  data: null
};
if (state.contrast === 'high') document.documentElement.setAttribute('data-contrast', 'high');

// ── PWA ──
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e;
  const btn = $('#installBtn');
  if (btn) btn.style.display = 'block';
});
$('#installBtn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('#installBtn').style.display = 'none';
  toast('App install started');
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
}

// ── Contrast ──
const contrastToggle = $('#contrastToggle');
contrastToggle.addEventListener('click', toggleContrast);
contrastToggle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { toggleContrast(); e.preventDefault(); }
});
function toggleContrast() {
  const on = contrastToggle.getAttribute('aria-checked') !== 'true';
  contrastToggle.setAttribute('aria-checked', on ? 'true' : 'false');
  document.documentElement[on ? 'setAttribute' : 'removeAttribute']('data-contrast', 'high');
  localStorage.setItem('hr_contrast', on ? 'high' : 'normal');
}

// ── Toast ──
let toastTimer = null;
function toast(msg, type = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ` ${type}-t` : '');
  t.style.display = 'block';
  t.style.opacity = '1';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.style.display = 'none', 200); }, 2200);
}

// ── Persistence ──
function save() {
  localStorage.setItem('hr_name', state.player.name || '');
  localStorage.setItem('hr_badges', JSON.stringify(state.badges));
  localStorage.setItem('hr_progress', JSON.stringify(state.progress));
}

// ── Data ──
async function loadData() {
  const res = await fetch('content.json');
  state.data = await res.json();
}

// ── Helpers ──
const ICONS = { fire: '🔥', electrical: '⚡', life: '❤️', maintenance: '🧰' };
const SUMMARIES = {
  fire: 'Alarms, cooking, heaters, dryer safety, and escape plans.',
  electrical: 'GFCI, cords, power strips, and safe heater use.',
  life: 'CO detectors, water temp, slips/falls, and safe storage.',
  maintenance: 'Filters, leaks, hose bibs, and fridge coils.'
};

function getModuleProgress(moduleId) {
  const p = state.progress[moduleId] || {};
  const done = (p.cards ? 1 : 0) + (p.doDone ? 1 : 0) + (p.quizScore ? 1 : 0);
  return { pct: Math.round((done / 3) * 100), p };
}

function checkBadge(moduleId) {
  const p = state.progress[moduleId] || {};
  if (p.cards && p.doDone && (p.quizScore || 0) >= 75) {
    if (!state.badges.includes(moduleId)) {
      state.badges.push(moduleId);
      save();
      return true; // newly earned
    }
  }
  return false;
}

function markLearnDone(moduleId) {
  const m = state.data.modules.find(x => x.id === moduleId);
  state.progress[moduleId] = state.progress[moduleId] || {};
  state.progress[moduleId].cards = m.cards.length;
  save();
}

// ── Home Screen ──
function start() {
  const overallPct = Math.round((state.badges.length / 4) * 100);
  const name = state.player.name;

  $('#app').innerHTML = `
    <div class="home-header">
      <h2>${name ? `Welcome, ${name}.` : 'Home Ready'}</h2>
      <p>Complete each module to earn your Home Ready certificate.</p>
      <div class="overall-progress">
        <div class="progress-bar"><div class="fill" style="width:${overallPct}%"></div></div>
        <span>${state.badges.length}/4 badges</span>
      </div>
    </div>

    ${!name ? `<div class="card" style="margin-bottom:16px">
      <p style="margin-bottom:12px;font-weight:500">Enter your name to personalize your certificate:</p>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input id="nameInput" type="text" placeholder="First name" value=""
          style="padding:10px 14px;border:2px solid var(--border);border-radius:var(--radius-sm);font-size:.95rem;font-family:var(--font-body);color:var(--fg);background:var(--bg);outline:none;transition:border-color .15s;width:200px"
          onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border)'" />
        <button class="btn btn-primary" id="saveName">Save</button>
        <button class="btn btn-ghost" id="skipName">Skip</button>
      </div>
    </div>` : ''}

    <div class="module-grid">
      ${state.data.modules.map(m => {
        const { pct } = getModuleProgress(m.id);
        const earned = state.badges.includes(m.id);
        return `<div class="module-card ${earned ? 'done' : ''}" data-go="${m.id}" tabindex="0" role="button" aria-label="Open ${m.title} module">
          <div class="module-icon">${ICONS[m.id] || '🏠'}</div>
          <h3>${m.title}</h3>
          <p>${SUMMARIES[m.id] || ''}</p>
          <div class="progress-bar" style="margin-bottom:8px"><div class="fill" style="width:${pct}%"></div></div>
          <div style="font-size:.78rem;color:var(--muted);font-weight:600">${pct}% complete</div>
        </div>`;
      }).join('')}
    </div>

    ${state.badges.length === 4 ? `
    <div class="cert-card">
      <div style="font-size:2rem;margin-bottom:8px">🏆</div>
      <h3>All badges earned!</h3>
      <p style="color:var(--muted);font-size:.88rem;margin:8px 0 14px">Download your official Home Ready certificate.</p>
      <button class="btn btn-accent" id="downloadCert">Download Certificate</button>
    </div>` : ''}

    <div class="community-tip">${randPick(state.data.voice.community_tips)}</div>
  `;

  $('#saveName')?.addEventListener('click', () => {
    const val = $('#nameInput')?.value.trim();
    if (!val) { toast('Enter a name first'); return; }
    state.player.name = val; save(); start();
  });
  $('#skipName')?.addEventListener('click', () => { state.player.name = ''; save(); start(); });

  $$('.module-card').forEach(c => {
    c.addEventListener('click', () => openModule(c.getAttribute('data-go')));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openModule(c.getAttribute('data-go')); });
  });
  $('#downloadCert')?.addEventListener('click', downloadCertificate);
  $('#app').focus();
}

// ── Module View ──
function openModule(id, activeTab = 'learn') {
  const m = state.data.modules.find(x => x.id === id);
  const { p } = getModuleProgress(id);

  $('#app').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
      <button class="btn btn-ghost" id="back">← Back</button>
    </div>
    <div class="module-hero">
      <div class="module-hero-icon">${ICONS[id] || '🏠'}</div>
      <div>
        <h2>${m.title}</h2>
        <p>${SUMMARIES[id]}</p>
      </div>
    </div>
    <div class="card">
      <div class="tab-row" role="tablist">
        <button class="tab-btn${p.cards ? ' done-tab' : ''}" role="tab" aria-selected="${activeTab === 'learn' ? 'true' : 'false'}" data-tab="learn">📖 Learn</button>
        <button class="tab-btn${p.doDone ? ' done-tab' : ''}" role="tab" aria-selected="${activeTab === 'do' ? 'true' : 'false'}" data-tab="do">🎯 Do</button>
        <button class="tab-btn${(p.quizScore || 0) >= 75 ? ' done-tab' : ''}" role="tab" aria-selected="${activeTab === 'check' ? 'true' : 'false'}" data-tab="check">✅ Check</button>
      </div>
      <div id="tab-content"></div>
    </div>
    <div class="community-tip" style="margin-top:12px"><strong>Community care:</strong> ${randPick(state.data.voice.community_tips)}</div>
  `;

  $('#back').addEventListener('click', start);

  $$('button[role="tab"]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('button[role="tab"]').forEach(b => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
      loadTab(id, btn.getAttribute('data-tab'));
    });
  });

  loadTab(id, activeTab);
  $('#app').focus();
}

function loadTab(moduleId, tab) {
  const m = state.data.modules.find(x => x.id === moduleId);
  if (tab === 'learn') renderLearn(m);
  else if (tab === 'do') {
    if (m.do === 'findfix') renderFindFix(m);
    else if (m.do === 'dragdrop') renderDragDrop(m);
    else if (m.do === 'hotornot') renderHotOrNot(m);
    else if (m.do === 'calendar') renderCalendar(m);
  } else if (tab === 'check') {
    renderQuiz(m);
  }
}

function autoAdvance(moduleId, doneTab) {
  // After completing a section, suggest the next tab
  const tabs = ['learn', 'do', 'check'];
  const next = tabs[tabs.indexOf(doneTab) + 1];
  if (next) {
    setTimeout(() => {
      toast(`Great! Moving to next section...`);
      setTimeout(() => openModule(moduleId, next), 900);
    }, 400);
  }
}

// ── Learn Tab ──
function renderLearn(m) {
  const wrap = $('#tab-content');
  const alreadyDone = !!(state.progress[m.id]?.cards);
  wrap.innerHTML = `
    <div style="animation:fade-up .25s ease">
      ${m.cards.map((c, i) => `
        <div class="learn-card">
          <div class="step-num">Tip ${i + 1} of ${m.cards.length}</div>
          ${c}
        </div>
      `).join('')}
      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary" id="markLearn">
          ${alreadyDone ? '✓ Reviewed' : 'Mark as Read →'}
        </button>
        ${alreadyDone ? '<span style="font-size:.82rem;color:var(--muted)">Continue to Do tab</span>' : ''}
      </div>
    </div>
  `;
  $('#markLearn').addEventListener('click', () => {
    markLearnDone(m.id);
    toast(randPick(state.data.voice.coach_lines));
    autoAdvance(m.id, 'learn');
  });
}

// ── Find & Fix ──
function renderFindFix(m) {
  const wrap = $('#tab-content');
  let fixed = 0;
  wrap.innerHTML = `
    <div style="margin-bottom:14px">
      <p style="color:var(--muted);font-size:.88rem">Tap each hazard to reveal the safe fix.</p>
    </div>
    <div class="hazard-grid">
      ${m.hazards.map(h => `
        <div class="hazard-item" id="hz-${h.id}">
          <div class="hazard-title">⚠️ ${h.text}</div>
          <button class="btn btn-secondary" data-fix="${h.id}" style="font-size:.82rem;padding:8px 14px">Apply Fix</button>
          <div class="hazard-tip" id="tip-${h.id}">✓ ${h.correct}</div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:16px" id="fix-footer">
      <span style="font-size:.85rem;color:var(--muted)">Fix all hazards above to continue.</span>
    </div>
  `;

  m.hazards.forEach(h => {
    $(`[data-fix="${h.id}"]`).addEventListener('click', (e) => {
      const item = $(`#hz-${h.id}`);
      item.classList.add('fixed');
      e.currentTarget.disabled = true;
      fixed++;
      if (fixed === m.hazards.length) {
        const footer = $('#fix-footer');
        footer.innerHTML = `<button class="btn btn-primary" id="complete">All hazards fixed! Continue →</button>`;
        $('#complete').addEventListener('click', () => {
          state.progress[m.id] = state.progress[m.id] || {};
          state.progress[m.id].doDone = true;
          save();
          const earned = checkBadge(m.id);
          if (earned) toast('🏅 Badge earned!');
          else toast(randPick(state.data.voice.coach_lines));
          autoAdvance(m.id, 'do');
        });
      }
    });
  });
}

// ── Drag & Drop ──
function renderDragDrop(m) {
  const wrap = $('#tab-content');
  const placements = {};
  wrap.innerHTML = `
    <p style="color:var(--muted);font-size:.88rem;margin-bottom:14px">Drag each item to its correct zone.</p>
    <div id="drag-layout" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <div style="font-family:var(--font-display);font-size:.8rem;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Items</div>
        <div class="drag-area" id="drag-items">
          ${m.drag_items.map(i => `
            <div class="draggable" draggable="true" tabindex="0" data-id="${i.id}">${i.label}</div>
          `).join('')}
        </div>
      </div>
      <div>
        <div style="font-family:var(--font-display);font-size:.8rem;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Zones</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${m.dropzones.map(z => `
            <div class="dropzone" data-zone="${z.id}">
              <div class="zone-label">${z.label}</div>
              <div class="zone-contents"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div style="margin-top:16px;display:flex;gap:10px;align-items:center">
      <button class="btn btn-primary" id="checkDrag">Check Answers</button>
      <button class="btn btn-ghost" id="resetDrag">Reset</button>
    </div>
    <div id="drag-result" style="margin-top:10px"></div>
  `;

  $$('#drag-items .draggable').forEach(el => {
    el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', el.dataset.id); el.style.opacity = '.5'; });
    el.addEventListener('dragend', () => el.style.opacity = '1');
  });
  $$('.dropzone').forEach(zone => {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      placements[id] = zone.dataset.zone;
      zone.querySelector('.zone-contents').textContent = m.drag_items.find(i => i.id === id)?.label || id;
      zone.classList.add('zone-ok');
      $(`[data-id="${id}"]`)?.classList.add('placed');
    });
  });
  $('#checkDrag').addEventListener('click', () => {
    let correct = 0;
    m.drag_items.forEach(i => { if (placements[i.id] === i.target) correct++; });
    const pct = Math.round((correct / m.drag_items.length) * 100);
    const result = $('#drag-result');
    if (pct === 100) {
      result.innerHTML = `<div class="explain-box">✅ All correct! Great work.</div>`;
      state.progress[m.id] = state.progress[m.id] || {};
      state.progress[m.id].doDone = true; save();
      const earned = checkBadge(m.id);
      if (earned) toast('🏅 Badge earned!');
      autoAdvance(m.id, 'do');
    } else {
      result.innerHTML = `<div class="explain-box" style="border-color:var(--bad)">You got ${pct}% — try rearranging and check again.</div>`;
    }
  });
  $('#resetDrag').addEventListener('click', () => renderDragDrop(m.id.length ? m : state.data.modules.find(x => x.id === m.id)));
}

// ── Hot or Not ──
function renderHotOrNot(m) {
  const wrap = $('#tab-content');
  let idx = 0, score = 0;

  const render = () => {
    if (idx >= m.hot.length) {
      // Results
      const pct = Math.round((score / m.hot.length) * 100);
      wrap.innerHTML = `
        <div class="result-block">
          <div class="result-score">${pct}%</div>
          <div class="result-label">Score — ${score}/${m.hot.length} correct</div>
          ${pct >= 75 ? `<div class="badge-earned">🏅 Activity Complete!</div>` : ''}
          <p style="color:var(--muted);font-size:.85rem;margin:12px 0 16px">${pct >= 75 ? 'Nice work!' : 'Review the tips and try again.'}</p>
          ${pct < 75 ? `<button class="btn btn-secondary" id="retryHon">Try Again</button>` : ''}
        </div>
      `;
      if (pct >= 75) {
        state.progress[m.id] = state.progress[m.id] || {};
        state.progress[m.id].doDone = true; save();
        checkBadge(m.id);
        autoAdvance(m.id, 'do');
      }
      $('#retryHon')?.addEventListener('click', () => renderHotOrNot(m));
      return;
    }

    const item = m.hot[idx];
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <span style="font-family:var(--font-display);font-size:.78rem;font-weight:700;color:var(--muted)">${idx + 1} / ${m.hot.length}</span>
        <span class="badge">Score: ${score}</span>
      </div>
      <div class="progress-bar" style="margin-bottom:18px">
        <div class="fill" style="width:${(idx / m.hot.length) * 100}%"></div>
      </div>
      <div class="hon-card" id="honCard">${item.prompt}</div>
      <div class="hon-btns">
        <button class="btn btn-primary" id="hot" style="background:var(--good)">👍 Safe (Hot)</button>
        <button class="btn btn-danger" id="not">👎 Unsafe (Not)</button>
      </div>
      <div id="hon-tip" style="display:none" class="explain-box" style="margin-top:12px"></div>
    `;

    const answer = (ans) => {
      $('#hot').disabled = true;
      $('#not').disabled = true;
      const correct = item.answer === ans;
      if (correct) score++;
      $('#hon-tip').textContent = item.tip;
      $('#hon-tip').style.display = 'block';
      $('#hon-tip').style.borderColor = correct ? 'var(--good)' : 'var(--bad)';
      toast(correct ? '✓ Correct!' : 'Not quite.', correct ? 'correct' : 'wrong');
      setTimeout(() => { idx++; render(); }, 1400);
    };
    $('#hot').addEventListener('click', () => answer('hot'));
    $('#not').addEventListener('click', () => answer('not'));
  };

  render();
}

// ── Maintenance Calendar ──
function renderCalendar(m) {
  const wrap = $('#tab-content');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const plan = {};

  wrap.innerHTML = `
    <p style="color:var(--muted);font-size:.88rem;margin-bottom:14px">Drag tasks to the right months.</p>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div>
        <div style="font-family:var(--font-display);font-size:.8rem;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Tasks</div>
        <div class="drag-area" id="cal-tasks">
          ${m.tasks.map(t => `
            <div class="draggable" draggable="true" data-id="${t.id}">${t.label}</div>
          `).join('')}
        </div>
      </div>
      <div>
        <div style="font-family:var(--font-display);font-size:.8rem;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Schedule</div>
        <div class="month-grid">
          ${months.map(mon => `
            <div class="month-zone" data-month="${mon}">
              <div class="month-name">${mon}</div>
              <div class="month-tasks" id="mt-${mon}"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div style="margin-top:16px;display:flex;gap:10px">
      <button class="btn btn-primary" id="checkPlan">Check Plan</button>
      <button class="btn btn-ghost" id="clearPlan">Clear</button>
    </div>
    <div id="plan-result" style="margin-top:10px"></div>
  `;

  $$('#cal-tasks .draggable').forEach(el => {
    el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', el.dataset.id); });
  });
  $$('.month-zone').forEach(zone => {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      const mon = zone.dataset.month;
      plan[id] = plan[id] || [];
      if (!plan[id].includes(mon)) plan[id].push(mon);
      const taskEl = m.tasks.find(t => t.id === id);
      const mt = $(`#mt-${mon}`);
      const abbr = taskEl?.label.split(' ').slice(0, 2).join(' ') || id;
      mt.textContent = (mt.textContent ? mt.textContent + ', ' : '') + abbr;
      zone.classList.add('has-task');
    });
  });

  $('#checkPlan').addEventListener('click', () => {
    let ok = 0; const notes = [];
    m.tasks.forEach(t => {
      const when = plan[t.id] || [];
      const rec = t.recommended;
      const good = rec.includes('Every Month') ? when.length >= 4 : when.some(x => rec.includes(x));
      if (good) ok++;
      else notes.push(`Schedule "${t.label}" in: ${rec.join(', ')}`);
    });
    const pct = Math.round((ok / m.tasks.length) * 100);
    const result = $('#plan-result');
    if (pct >= 75) {
      result.innerHTML = `<div class="explain-box">✅ Good plan (${pct}%)! You've covered the key tasks.</div>`;
      state.progress[m.id] = state.progress[m.id] || {};
      state.progress[m.id].doDone = true; save();
      checkBadge(m.id);
      autoAdvance(m.id, 'do');
    } else {
      result.innerHTML = `<div class="explain-box" style="border-color:var(--bad)">${pct}% — ${notes.join(' • ')}</div>`;
    }
  });
  $('#clearPlan').addEventListener('click', () => { Object.keys(plan).forEach(k => delete plan[k]); renderCalendar(m); });
}

// ── Quiz ──
function renderQuiz(m) {
  const wrap = $('#tab-content');
  let idx = 0, score = 0;
  const LETTERS = ['A', 'B', 'C', 'D'];

  const show = () => {
    if (idx >= m.quiz.length) {
      // Final result
      const pct = Math.round((score / m.quiz.length) * 100);
      const pass = pct >= 75;
      wrap.innerHTML = `
        <div class="result-block">
          <div class="result-score" style="color:${pass ? 'var(--good)' : 'var(--bad)'}">${pct}%</div>
          <div class="result-label">${score} / ${m.quiz.length} correct</div>
          ${pass ? `<div class="badge-earned">🏅 ${m.title} Badge Earned!</div>` : ''}
          <p style="color:var(--muted);font-size:.88rem;margin:12px 0 16px">
            ${pass ? randPick(state.data.voice.coach_lines) : 'Review the Learn section and try again.'}
          </p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            ${!pass ? `<button class="btn btn-secondary" id="retryQuiz">Retry Quiz</button>` : ''}
            <button class="btn btn-ghost" id="backHome">← Back to Home</button>
          </div>
        </div>
      `;
      state.progress[m.id] = state.progress[m.id] || {};
      state.progress[m.id].quizScore = pct; save();
      if (pass) {
        const earned = checkBadge(m.id);
        if (earned) toast('🏅 Badge earned!');
      }
      $('#retryQuiz')?.addEventListener('click', () => { idx = 0; score = 0; show(); });
      $('#backHome')?.addEventListener('click', start);
      return;
    }

    const q = m.quiz[idx];
    wrap.innerHTML = `
      <div class="q-header">
        <div class="q-counter">Question ${idx + 1} / ${m.quiz.length}</div>
        <span class="badge">Score: ${score}</span>
      </div>
      <div class="progress-bar" style="margin-bottom:18px">
        <div class="fill" style="width:${(idx / m.quiz.length) * 100}%"></div>
      </div>
      <div class="q-text">${q.q}</div>
      <div class="choices">
        ${q.choices.map((c, i) => `
          <button class="choice-btn" data-i="${i}" aria-label="Option ${LETTERS[i]}: ${c}">
            <span class="choice-letter">${LETTERS[i]}</span>
            ${c}
          </button>
        `).join('')}
      </div>
      <div id="explain" style="display:none"></div>
      <div id="next-hint" class="next-hint" style="display:none">Advancing in a moment…</div>
    `;

    $$('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = parseInt(btn.dataset.i, 10);
        const correct = chosen === q.a;
        if (correct) score++;

        // Lock all choices, reveal correct/wrong
        $$('.choice-btn').forEach((b, i) => {
          b.disabled = true;
          if (i === q.a) b.classList.add('correct');
          else if (parseInt(b.dataset.i, 10) === chosen && !correct) b.classList.add('wrong');
        });

        const explain = $('#explain');
        explain.className = 'explain-box';
        explain.textContent = q.explain;
        explain.style.display = 'block';

        toast(correct ? '✓ Correct!' : 'Not quite.', correct ? 'correct' : 'wrong');
        $('#next-hint').style.display = 'block';

        setTimeout(() => { idx++; show(); }, 1600);
      });
    });
  };

  show();
}

// ── Certificate ──
function downloadCertificate() {
  if (state.badges.length < 4) { toast('Earn all 4 badges first.'); return; }
  const name = state.player.name || 'Resident';
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 800;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 800);
  g.addColorStop(0, '#e8f3f2'); g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1200, 800);
  ctx.strokeStyle = '#0a4d4a'; ctx.lineWidth = 10; ctx.strokeRect(20, 20, 1160, 760);
  ctx.strokeStyle = '#f0a500'; ctx.lineWidth = 4; ctx.strokeRect(30, 30, 1140, 740);
  ctx.fillStyle = '#0a4d4a'; ctx.font = 'bold 46px sans-serif';
  ctx.fillText('Home Ready — Tribes Protecting Tribes', 80, 140);
  ctx.font = '22px sans-serif'; ctx.fillStyle = '#5a6e6c';
  ctx.fillText('Protect our people. Strengthen our communities.', 80, 178);
  ctx.fillStyle = '#0d1a19'; ctx.font = 'bold 40px sans-serif';
  ctx.fillText(name, 80, 255);
  ctx.font = '22px sans-serif'; ctx.fillStyle = '#333';
  ctx.fillText('has completed all modules and earned:', 80, 295);
  ['🔥 Fire Safety', '⚡ Electrical Safety', '❤️ Life Safety', '🧰 Maintenance Basics'].forEach((b, i) => {
    ctx.fillText(b, 100, 358 + i * 48);
  });
  ctx.beginPath(); ctx.moveTo(80, 620); ctx.lineTo(500, 620); ctx.strokeStyle = '#0a4d4a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#0a4d4a'; ctx.font = 'bold 18px sans-serif';
  ctx.fillText('AMERIND Risk Control', 80, 650);
  ctx.fillStyle = '#333'; ctx.font = '18px sans-serif';
  ctx.fillText(new Date().toLocaleDateString(), 80, 680);
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = `HomeReady-Certificate-${name.replace(/\s+/g, '-')}.png`;
  a.click();
}

// ── Boot ──
(async function () {
  await loadData();
  const contrastOn = localStorage.getItem('hr_contrast') === 'high';
  $('#contrastToggle').setAttribute('aria-checked', contrastOn ? 'true' : 'false');
  start();
})();
