// ── 앱 메인 로직 ──

const CAL_API = 'https://script.google.com/macros/s/AKfycbxdV0OnmYLFCZl_QhI_DPyz2hEZyEruaR72HFuSFhO4KD9cOB7bmSHIocYmRYQX5e8V/exec';

let weekStart = getMon(new Date());

// ── 현재 화면에서 데이터 수집 ──
function collectWeek() {
  const saved = JSON.parse(JSON.stringify(cloudSched));
  for (let i = 0; i < 7; i++) {
    const key  = toKey(addDays(weekStart, i));
    const rows = document.querySelectorAll(`tr[data-key="${key}"]`);
    if (!rows.length) continue;
    const slots = [];
    rows.forEach(tr => {
      slots.push({
        slot:   tr.querySelector('.f-slot')   ? tr.querySelector('.f-slot').value   : '',
        guest:  tr.querySelector('.f-guest')  ? tr.querySelector('.f-guest').value  : '',
        prod:   tr.querySelector('.f-prod')   ? tr.querySelector('.f-prod').value   : '',
        edit:   tr.querySelector('.f-edit')   ? tr.querySelector('.f-edit').value   : '',
        upload: tr.querySelector('.f-upload') ? tr.querySelector('.f-upload').value : '',
        res:    tr.querySelector('.f-res')    ? tr.querySelector('.f-res').checked  : false,
        note:   tr.querySelector('.f-note')   ? tr.querySelector('.f-note').value   : ''
      });
    });
    saved[key] = slots;
  }
  return saved;
}

// ── 슬롯 추가 ──
function addSlot(key) {
  const updated = collectWeek();
  if (!updated[key]) updated[key] = getSlots(key);
  if (updated[key].length >= 2) { toast('2차 녹화까지만 추가 가능합니다'); return; }
  updated[key].push({ slot: '', guest: '', prod: '', edit: '', upload: '', res: false, note: '' });
  cloudSched = updated;
  render();
}

// ── 슬롯 삭제 ──
function delSlot(key, idx) {
  const updated = collectWeek();
  if (!updated[key] || updated[key].length <= 1) return;
  updated[key].splice(idx, 1);
  cloudSched = updated;
  render();
}

// ── 전체 저장 ──
async function saveAll() {
  const newData = collectWeek();

  // 변경된 날짜만 추려서 캘린더 동기화
  const changedKeys = [];
  for (let i = 0; i < 7; i++) {
    const key        = toKey(addDays(weekStart, i));
    const oldSlots   = JSON.stringify(getSlots(key));
    const newSlots   = JSON.stringify(newData[key] || []);
    if (oldSlots !== newSlots) {
      changedKeys.push(key);
    }
  }

  // Firebase 저장
  await pushCloud('sched', newData);
  await saveMemoFromUI();

  // UI 업데이트
  const ts = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('lastSaved').textContent = '저장: ' + ts;
  toast('💾 저장되었습니다');

  // 변경된 날짜 중 최건일/양영은 녹화 일정만 캘린더 동기화
  changedKeys.forEach(dateKey => {
    const slots = newData[dateKey];
    if (!slots) return;

    // 해당 날짜에 최건일 또는 양영은 녹화 슬롯이 하나라도 있으면 동기화
    const hasTarget = slots.some(s =>
      s.slot && s.guest &&
      s.slot !== '-' && s.slot !== '' &&
      (s.prod === '최건일' || s.prod === '양영은')
    );

    if (hasTarget) {
      fetch(`${CAL_API}?action=sync&dateKey=${dateKey}`)
        .then(r => r.json())
        .then(res => {
          if (res.ok) {
            console.log('캘린더 등록 완료:', dateKey);
          } else {
            console.warn('캘린더 응답 이상:', dateKey, res);
          }
        })
        .catch(e => console.warn('캘린더 동기화 실패:', dateKey, e));
    }
  });
}

// ── 이번 주 초기화 ──
async function clearWeekData() {
  if (!confirm('이번 주 데이터를 PRESET 원본으로 초기화할까요?')) return;
  const data = JSON.parse(JSON.stringify(cloudSched));
  for (let i = 0; i < 7; i++) delete data[toKey(addDays(weekStart, i))];
  cloudSched = data;
  await pushCloud('sched', data);
  render();
  toast('초기화되었습니다');
}

// ── 메모 UI 로드 ──
function loadMemoUI() {
  const wk = toKey(weekStart);
  const d  = cloudMemos[wk] || {};
  document.getElementById('memo-yye').value  = d.yye  || '';
  document.getElementById('memo-cgil').value = d.cgil || '';
  document.getElementById('memo-etc').value  = d.etc  || '';
}

// ── 메모 저장 ──
async function saveMemoFromUI() {
  const wk      = toKey(weekStart);
  const updated = JSON.parse(JSON.stringify(cloudMemos));
  updated[wk]   = {
    yye:  document.getElementById('memo-yye').value,
    cgil: document.getElementById('memo-cgil').value,
    etc:  document.getElementById('memo-etc').value
  };
  await pushCloud('memo', updated);
}

// ── 주간 이동 ──
function changeWeek(dir) { weekStart = addDays(weekStart, dir * 7); render(); }
function goToday()       { weekStart = getMon(new Date()); render(); }

// ── 단축키 (Ctrl/Cmd + S) ──
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveAll();
  }
});

// ── 초기 실행 ──
(async () => {
  try {
    await fetchCloud();
  } catch (e) {
    console.warn('초기 데이터 로드 실패:', e);
  } finally {
    render();
    document.getElementById('loadingOverlay').classList.add('hide');
    startRealtimeSync();
  }
})();
