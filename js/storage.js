// ── 클라우드(Google Sheets) + localStorage 캐시 ──

let cloudSched = {};
let cloudMemos = {};

// ── 읽기 (GET) ──
async function fetchCloud(){
  // 1. localStorage 캐시 먼저 반영
  try{
    const lc = localStorage.getItem('mh_sched6');
    if(lc) cloudSched = JSON.parse(lc);
    const lm = localStorage.getItem('mh_memos6');
    if(lm) cloudMemos = JSON.parse(lm);
  }catch(e){}

  // 2. Google Sheets에서 최신 데이터 가져오기
  try{
    const [rs, rm] = await Promise.all([
      fetch(API + '?action=read&type=sched&t=' + Date.now())
        .then(r => r.json()).catch(() => null),
      fetch(API + '?action=read&type=memo&t=' + Date.now())
        .then(r => r.json()).catch(() => null)
    ]);
    if(rs && typeof rs === 'object' && !Array.isArray(rs) && Object.keys(rs).length > 0){
      cloudSched = rs;
      localStorage.setItem('mh_sched6', JSON.stringify(rs));
    }
    if(rm && typeof rm === 'object' && !Array.isArray(rm) && Object.keys(rm).length > 0){
      cloudMemos = rm;
      localStorage.setItem('mh_memos6', JSON.stringify(rm));
    }
  }catch(e){
    console.warn('Google Sheets 읽기 실패, 로컬캐시 사용:', e);
  }
}

// ── 쓰기 (POST → no-cors 우회, localStorage 우선) ──
async function pushCloud(type, data){
  // 1. localStorage 즉시 저장 (항상 성공)
  if(type === 'sched'){
    cloudSched = data;
    localStorage.setItem('mh_sched6', JSON.stringify(data));
  } else {
    cloudMemos = data;
    localStorage.setItem('mh_memos6', JSON.stringify(data));
  }

  // 2. Google Sheets에 POST로 저장
  try{
    const body = JSON.stringify({ type, data });
    await fetch(API, {
      method: 'POST',
      mode: 'no-cors',          // CORS 우회 — 응답은 못 읽지만 전송은 됨
      headers: { 'Content-Type': 'text/plain' }, // simple request 조건 충족
      body: body
    });
  }catch(e){
    console.warn('Google Sheets 저장 실패 (로컬에는 저장됨):', e);
  }
}

// ── PRESET + 저장 데이터 병합 ──
function getSlots(key){
  if(cloudSched[key]) return JSON.parse(JSON.stringify(cloudSched[key]));
  if(P[key])          return JSON.parse(JSON.stringify(P[key]));
  return [{slot:'',guest:'',prod:'',edit:'',upload:'',res:false,note:''}];
}
