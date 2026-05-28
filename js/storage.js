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

  // 2. Google Sheets 최신 데이터
  try{
    const [rs, rm] = await Promise.all([
      fetch(API + '?type=sched&t=' + Date.now())
        .then(r => r.json()).catch(() => null),
      fetch(API + '?type=memo&t=' + Date.now())
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
    console.warn('Sheets 읽기 실패, 로컬캐시 사용:', e);
  }
}

// ── 쓰기 (form submit 방식 — CORS 완전 우회) ──
function pushCloudForm(type, data){
  return new Promise((resolve) => {
    try{
      const dataStr = JSON.stringify(data);

      // 숨김 iframe (응답 받는 용도)
      let iframe = document.getElementById('_cf');
      if(!iframe){
        iframe = document.createElement('iframe');
        iframe.id   = '_cf';
        iframe.name = '_cf';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }

      // 숨김 form 생성
      const form = document.createElement('form');
      form.method  = 'POST';
      form.action  = API;
      form.target  = '_cf';
      form.enctype = 'application/x-www-form-urlencoded';
      form.style.display = 'none';

      const addField = (name, value) => {
        const input = document.createElement('input');
        input.type  = 'hidden';
        input.name  = name;
        input.value = value;
        form.appendChild(input);
      };
      addField('type', type);
      addField('data', dataStr);

      document.body.appendChild(form);
      form.submit();

      // form 제거
      setTimeout(() => {
        document.body.removeChild(form);
        resolve();
      }, 1500);
    }catch(e){
      console.warn('form submit 실패:', e);
      resolve();
    }
  });
}

async function pushCloud(type, data){
  // 1. localStorage 즉시 저장
  if(type === 'sched'){
    cloudSched = data;
    localStorage.setItem('mh_sched6', JSON.stringify(data));
  } else {
    cloudMemos = data;
    localStorage.setItem('mh_memos6', JSON.stringify(data));
  }

  // 2. Google Sheets에 form submit으로 저장
  await pushCloudForm(type, data);
}

// ── PRESET + 저장 데이터 병합 ──
function getSlots(key){
  if(cloudSched[key]) return JSON.parse(JSON.stringify(cloudSched[key]));
  if(P[key])          return JSON.parse(JSON.stringify(P[key]));
  return [{slot:'',guest:'',prod:'',edit:'',upload:'',res:false,note:''}];
}
