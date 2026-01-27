/* ---------- 설정/상수 ---------- */
// ★ 1) 토큰: URL ?token=... 우선 → localStorage → prompt
function readToken() {
  const qs = new URLSearchParams(location.search);
  const tFromQuery = qs.get('token');
  if (tFromQuery) {
    localStorage.setItem('ADMIN_TOKEN', tFromQuery);
    return tFromQuery;
  }
  const t = localStorage.getItem('ADMIN_TOKEN') || prompt('X-Admin-Token?');
  if (t) localStorage.setItem('ADMIN_TOKEN', t);
  return t || '';
}
const TOKEN = readToken();

// 카테고리 표시용 매핑
const CAT_NAME = {
  '100': '정치시사',
  '101': '경제비즈니스',
  '104': '세계',
};

// 스케줄 API 베이스 경로 (컨트롤러 @RequestMapping("/admin/schedule"))
// const SCHEDULE_BASE = '/admin/schedule';
const SCHEDULE_BASE = '/api/admin/schedule';

/* ---------- 공용 fetch ---------- */
async function api(url, opt = {}) {
  const init = {
    method: opt.method || 'GET',
    headers: { 'X-Admin-Token': TOKEN, ...(opt.headers || {}) },
    body: opt.body
  };
  try {
    const res = await fetch(url, init);
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      const msg = ct.includes('application/json') ? JSON.stringify(await res.json()) : await res.text();
      // ★ 2) 디버그 로그 강화
      console.error('[API ERROR]', { url, init, status: res.status, statusText: res.statusText, body: msg });
      throw new Error(msg || ('HTTP ' + res.status));
    }
    return ct.includes('application/json') ? res.json() : res.text();
  } catch (e) {
    // 네트워크 레벨 에러까지 로깅
    console.error('[API FAIL]', { url, init, error: e });
    throw e;
  }
}

/* ---------- 카테고리 칩 렌더 ---------- */
function renderCategoryChips() {
  const box = document.getElementById('catChips');
  if (!box) return;
  box.innerHTML = '';
  Object.entries(CAT_NAME).forEach(([code, name]) => {
    const el = document.createElement('span');
    el.className = 'chip';
    el.textContent = `${name} (${code})`;
    box.appendChild(el);
  });
}

/* ---------- 기존 액션 ---------- */
async function post(url) {
  const txt = await api(url, { method: 'POST' });
  alert(txt);
  loadRuns().catch(() => {});
}

async function rerun() {
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const force = document.getElementById('force').value;
  // ★ 파라미터 포맷을 그대로 유지 (서버에서 :00 처리 지원 전제)
  await post(`/api/admin/pipeline/tfidf-rerun?from=${from}:00&to=${to}:00&force=${force}`);
}

async function snapshot() {
  const from = document.getElementById('s_from').value;
  const to = document.getElementById('s_to').value;
  const wipe = document.getElementById('wipe').value;
  await post(`/api/admin/trend/snapshot/build?from=${from}:00&to=${to}:00&wipeExisting=${wipe}`);
}

async function cleanup() {
  const hours = document.getElementById('hours').value;
  const snapOnly = document.getElementById('snapOnly').value;
  const txt = await api(`/api/admin/cleanup/older-than?hours=${hours}&snapshotsOnly=${snapOnly}`, {
    method: 'DELETE'
  });
  alert(txt);
  loadRuns().catch(() => {});
}

/* ---------- 실행 로그 ---------- */
function prettyParams(paramsJson) {
  if (!paramsJson) return '';
  try {
    const obj = JSON.parse(paramsJson);
    if (obj.category_code && CAT_NAME[obj.category_code]) {
      obj.category_code_label = `${CAT_NAME[obj.category_code]} (${obj.category_code})`;
    }
    return JSON.stringify(obj);
  } catch {
    return paramsJson.replace(/"category_code":"(\d+)"/g, (m, g1) =>
      `"category_code":"${g1}", "category_code_label":"${CAT_NAME[g1] || g1} (${g1})"`
    );
  }
}

async function loadRuns() {
  const data = await api('/api/admin/runs/latest?limit=50');
  const tb = document.querySelector('#runs tbody');
  if (!tb) return;
  tb.innerHTML = '';
  data.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.run_id}</td><td>${r.job_name}</td><td>${prettyParams(r.params_json)}</td>
      <td>${r.started_at?.replace('T', ' ') || ''}</td>
      <td>${r.finished_at?.replace('T', ' ') || ''}</td>
      <td class="${r.status === 'SUCCESS' ? 'ok' : (r.status === 'FAILED' ? 'fail' : '')}">${r.status}</td>
      <td>${r.note || ''}</td>`;
    tb.appendChild(tr);
  });
}

/* ---------- 스케줄 제어 ---------- */
const jobMap = {
  process_new_articles: '새 기사 처리',
  compute_tfidf: 'TF-IDF 계산',
  aggregate_trend_24h: '24h 트렌드 스냅샷',
  purge_trend_snapshot: '48h 이전 스냅샷 정리',
};

async function loadJobs() {
  let jobs;
  try { 
    jobs = await api(`${SCHEDULE_BASE}/jobs`); 
  } catch (e) {
    console.warn('[jobs fallback] using local jobMap keys', e);
    jobs = Object.keys(jobMap);
  }
  const sel = document.getElementById('job');
  if (!sel) return;
  sel.innerHTML = '';
  jobs.forEach(j => {
    const opt = document.createElement('option');
    opt.value = j; opt.textContent = `${jobMap[j] || j} (${j})`;
    sel.appendChild(opt);
  });
  await refreshStatus().catch(() => {});
}

function setStatusChip(paused) {
  const chip = document.getElementById('jobStatus');
  if (!chip) return;
  chip.classList.remove('ok', 'pause', 'fail');
  chip.classList.add(paused ? 'pause' : 'ok');
  const lab = chip.querySelector('span:last-child');
  if (lab) lab.textContent = paused ? '일시중지됨' : '동작 중';
}

async function refreshStatus() {
  const jobSel = document.getElementById('job');
  if (!jobSel) return;
  const job = jobSel.value;
  const res = await api(`${SCHEDULE_BASE}/status/${job}`);
  setStatusChip(!!res.paused);
}

async function pauseJob() {
  const job = document.getElementById('job').value;
  await api(`${SCHEDULE_BASE}/pause/${job}`, { method: 'POST' });
  setStatusChip(true);
}

async function resumeJob() {
  const job = document.getElementById('job').value;
  await api(`${SCHEDULE_BASE}/resume/${job}`, { method: 'POST' });
  setStatusChip(false);
}

/* ---------- 초기화 ---------- */
function initUIBindings() {
  document.getElementById('btnPause')?.addEventListener('click', () => pauseJob().catch(e => alert('일시중지 실패: ' + e.message)));
  document.getElementById('btnResume')?.addEventListener('click', () => resumeJob().catch(e => alert('재개 실패: ' + e.message)));
  document.getElementById('btnRefresh')?.addEventListener('click', () => refreshStatus().catch(e => alert('상태 조회 실패: ' + e.message)));

  document.getElementById('btnBackfill')?.addEventListener('click', () => post('/api/admin/backfill/category-code').catch(e => alert('백필 실패: ' + e.message)));
  document.getElementById('btnRerun')?.addEventListener('click', () => rerun().catch(e => alert('재실행 실패: ' + e.message)));
  document.getElementById('btnSnapshot')?.addEventListener('click', () => snapshot().catch(e => alert('스냅샷 실패: ' + e.message)));
  document.getElementById('btnCleanup')?.addEventListener('click', () => cleanup().catch(e => alert('정리 실패: ' + e.message)));

  document.getElementById('btnRunsRefresh')?.addEventListener('click', () => loadRuns().catch(() => {}));
}

(function bootstrap(){
  renderCategoryChips();
  initUIBindings();
  loadRuns().catch(() => {});
  loadJobs().catch(() => {});
})();
