// ── 앱 메인 로직 ──
// 주간 이동, 저장, 슬롯 추가/삭제, 메모, 초기화

let weekStart = getMon(new Date());

// 현재 화면에서 데이터 수집
function collectWeek(){
  const saved = JSON.parse(JSON.stringify(cloudSched));
  for(let i=0; i<7; i++){
    const key  = toKey(addDays(weekStart, i));
    const rows = document.querySelectorAll(`tr[data-key="${key}"]`);
    if(!rows.length) continue;
    const slots = [];
    rows.forEach(tr=>{
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

// 슬롯 추가
function addSlot(key){
  const updated = collectWeek();
  if(!updated[key]) updated[key] = getSlots(key);
  if(updated[key].length >= 2){ toast('2차 녹화까지만 추가 가능합니다'); return; }
  updated[key].push({slot:'',guest:'',prod:'',edit:'',upload:'',res:false,note:''});
  cloudSched = updated;
  render();
}

// 슬롯 삭제
function delSlot(key, idx){
  const updated = collectWeek();
  if(!updated[key] || updated[key].length <= 1) return;
  updated[key].splice(idx, 1);
  cloudSched = updated;
  render();
}

// 전체 저장
async function saveAll(){
  const data = collectWeek();
  await pushCloud('sched', data);
  await saveMemoFromUI();
  const ts = new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('lastSaved').textContent = '저장: '+ts;
  toast('💾 저장되었습니다');
}

// 이번 주 초기화
async function clearWeekData(){
  if(!confirm('이번 주 데이터를 PRESET 원본으로 초기화할까요?')) return;
  const data = JSON.parse(JSON.stringify(cloudSched));
  for(let i=0; i<7; i++) delete data[toKey(addDays(weekStart, i))];
  cloudSched = data;
  await pushCloud('sched', data);
  render();
  toast('초기화되었습니다');
}

// 메모 UI 로드
function loadMemoUI(){
  const wk = toKey(weekStart);
  const d  = cloudMemos[wk] || {};
  document.getElementById('memo-yye').value  = d.yye  || '';
  document.getElementById('memo-cgil').value = d.cgil || '';
  document.getElementById('memo-etc').value  = d.etc  || '';
}

// 메모 저장
async function saveMemoFromUI(){
  const wk      = toKey(weekStart);
  const updated = JSON.parse(JSON.stringify(cloudMemos));
  updated[wk]   = {
    yye:  document.getElementById('memo-yye').value,
    cgil: document.getElementById('memo-cgil').value,
    etc:  document.getElementById('memo-etc').value
  };
  await pushCloud('memo', updated);
}

// 주간 이동
function changeWeek(dir){ weekStart = addDays(weekStart, dir*7); render(); }
function goToday(){ weekStart = getMon(new Date()); render(); }

// 단축키
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.key==='s'){ e.preventDefault(); saveAll(); }
});

// 초기 실행
(async ()=>{
  try{
    await fetchCloud();
  }catch(e){
    console.warn('초기 데이터 로드 실패:', e);
  }finally{
    render();
    document.getElementById('loadingOverlay').classList.add('hide');
  }
})();
