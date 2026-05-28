// ── 클라우드(Google Sheets) + localStorage 캐시 ──
// 팀원들이 입력·저장한 데이터가 이 파일의 함수를 통해 관리됩니다.

let cloudSched = {};
let cloudMemos = {};

async function fetchCloud(){
  // 1. localStorage 캐시 먼저 반영 (빠른 초기 로드)
  try{
    const lc = localStorage.getItem('mh_sched6');
    if(lc) cloudSched = JSON.parse(lc);
    const lm = localStorage.getItem('mh_memos6');
    if(lm) cloudMemos = JSON.parse(lm);
  }catch(e){}

  // 2. Google Sheets에서 최신 데이터 가져오기
  try{
    const [rs, rm] = await Promise.all([
      fetch(API+'?type=sched&t='+Date.now()).then(r=>r.json()).catch(()=>null),
      fetch(API+'?type=memo&t='+Date.now()).then(r=>r.json()).catch(()=>null)
    ]);
    if(rs && typeof rs==='object'){
      cloudSched = rs;
      localStorage.setItem('mh_sched6', JSON.stringify(rs));
    }
    if(rm && typeof rm==='object'){
      cloudMemos = rm;
      localStorage.setItem('mh_memos6', JSON.stringify(rm));
    }
  }catch(e){
    console.warn('Google Sheets 연결 실패, 로컬 캐시 사용:', e);
  }
}

async function pushCloud(type, data){
  // localStorage 즉시 저장 (오프라인에서도 유지)
  if(type==='sched'){
    cloudSched = data;
    localStorage.setItem('mh_sched6', JSON.stringify(data));
  } else {
    cloudMemos = data;
    localStorage.setItem('mh_memos6', JSON.stringify(data));
  }
  // Google Sheets로 전송
  try{
    const body = 'payload='+encodeURIComponent(JSON.stringify({type, data}));
    await fetch(API, {
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body
    });
  }catch(e){
    console.warn('Google Sheets 저장 실패:', e);
  }
}

// PRESET과 저장 데이터 병합: 저장된 데이터가 있으면 우선 사용
function getSlots(key){
  if(cloudSched[key]) return JSON.parse(JSON.stringify(cloudSched[key]));
  if(P[key])          return JSON.parse(JSON.stringify(P[key]));
  return [{slot:'',guest:'',prod:'',edit:'',upload:'',res:false,note:''}];
}
