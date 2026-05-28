// ── 클라우드(Google Sheets) + localStorage 캐시 ──

let cloudSched = {};
let cloudMemos = {};

// 읽기
async function fetchCloud(){
  // 로컬캐시 먼저 (빠른 초기 렌더)
  try{
    const lc = localStorage.getItem('mh_sched6');
    if(lc) cloudSched = JSON.parse(lc);
    const lm = localStorage.getItem('mh_memos6');
    if(lm) cloudMemos = JSON.parse(lm);
  }catch(e){}

  // Google Sheets에서 최신 데이터 가져오기
  try{
    const [rs, rm] = await Promise.all([
      fetch(API + '?action=read&type=sched&t=' + Date.now())
        .then(r => r.json()).catch(() => null),
      fetch(API + '?action=read&type=memo&t=' + Date.now())
        .then(r => r.json()).catch(() => null)
    ]);
    if(rs && typeof rs === 'object' && !Array.isArray(rs)){
      cloudSched = rs;
      localStorage.setItem('mh_sched6', JSON.stringify(rs));
    }
    if(rm && typeof rm === 'object' && !Array.isArray(rm)){
      cloudMemos = rm;
      localStorage.setItem('mh_memos6', JSON.stringify(rm));
    }
  }catch(e){
    console.warn('Google Sheets 읽기 실패, 로컬캐시 사용:', e);
  }
}

// 쓰기 — GET 방식으로 저장 (CORS 완전 해결)
async function pushCloud(type, data){
  // 1. localStorage 즉시 저장
  if(type === 'sched'){
    cloudSched = data;
    localStorage.setItem('mh_sched6', JSON.stringify(data));
  } else {
    cloudMemos = data;
    localStorage.setItem('mh_memos6', JSON.stringify(data));
  }

  // 2. Google Sheets에 GET으로 저장
  try{
    const encoded = encodeURIComponent(JSON.stringify(data));
    const url = `${API}?action=write&type=${type}&data=${encoded}&t=${Date.now()}`;
    const res = await fetch(url).then(r => r.json()).catch(() => null);
    if(!res || !res.ok){
      console.warn('Google Sheets 저장 응답 이상:', res);
    }
  }catch(e){
    console.warn('Google Sheets 저장 실패 (로컬에는 저장됨):', e);
  }
}

// PRESET + 저장 데이터 병합
function getSlots(key){
  if(cloudSched[key]) return JSON.parse(JSON.stringify(cloudSched[key]));
  if(P[key])          return JSON.parse(JSON.stringify(P[key]));
  return [{slot:'',guest:'',prod:'',edit:'',upload:'',res:false,note:''}];
}
