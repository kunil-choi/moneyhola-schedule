// ── Firebase Realtime Database 연동 ──

// Firebase 설정
const firebaseConfig = {
  apiKey:            "AIzaSyB3WiHiR9zRoi8Q-xdmytjoGW-DASws1zI",
  authDomain:        "moneyhola-schedule.firebaseapp.com",
  databaseURL:       "https://moneyhola-schedule-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "moneyhola-schedule",
  storageBucket:     "moneyhola-schedule.firebasestorage.app",
  messagingSenderId: "816601350271",
  appId:             "1:816601350271:web:6784eff6061d5eb0277f4a"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let cloudSched = {};
let cloudMemos = {};

// ── 익명 인증 (로그인 화면 없이 DB 규칙의 auth != null 통과) ──
let authReady = null;
function ensureAuth(){
  if(!authReady){
    authReady = new Promise(resolve => {
      firebase.auth().onAuthStateChanged(user => {
        if(user) resolve(user);
      });
      firebase.auth().signInAnonymously().catch(e => {
        console.warn('Firebase 익명 로그인 실패:', e);
        resolve(null);
      });
    });
  }
  return authReady;
}

// ── 읽기 ──
async function fetchCloud(){
  // 1. localStorage 캐시 먼저 반영 (빠른 초기 렌더)
  try{
    const lc = localStorage.getItem('mh_sched7');
    if(lc) cloudSched = JSON.parse(lc);
    const lm = localStorage.getItem('mh_memos7');
    if(lm) cloudMemos = JSON.parse(lm);
  }catch(e){}

  // 2. Firebase에서 최신 데이터 가져오기
  try{
    await ensureAuth();
    const [snapS, snapM] = await Promise.all([
      db.ref('schedule').once('value'),
      db.ref('memos').once('value')
    ]);
    const rs = snapS.val();
    const rm = snapM.val();

    if(rs && typeof rs === 'object'){
      cloudSched = rs;
      localStorage.setItem('mh_sched7', JSON.stringify(rs));
    }
    if(rm && typeof rm === 'object'){
      cloudMemos = rm;
      localStorage.setItem('mh_memos7', JSON.stringify(rm));
    }
  }catch(e){
    console.warn('Firebase 읽기 실패, 로컬캐시 사용:', e);
  }
}

// ── 쓰기 ──
async function pushCloud(type, data){
  // 1. localStorage 즉시 저장
  if(type === 'sched'){
    cloudSched = data;
    localStorage.setItem('mh_sched7', JSON.stringify(data));
  } else {
    cloudMemos = data;
    localStorage.setItem('mh_memos7', JSON.stringify(data));
  }

  // 2. Firebase에 저장
  try{
    await ensureAuth();
    const ref = (type === 'sched') ? db.ref('schedule') : db.ref('memos');
    await ref.set(data);
  }catch(e){
    console.warn('Firebase 저장 실패 (로컬에는 저장됨):', e);
    toast('⚠️ 서버 저장 실패. 로컬에는 저장되었습니다.');
  }
}

// ── 실시간 동기화 (다른 팀원이 저장하면 자동 반영) ──
async function startRealtimeSync(){
  await ensureAuth();
  db.ref('schedule').on('value', snap => {
    const val = snap.val();
    if(val && typeof val === 'object'){
      cloudSched = val;
      localStorage.setItem('mh_sched7', JSON.stringify(val));
      // 현재 입력 중인 필드가 없을 때만 화면 갱신
      if(!document.activeElement ||
         !document.activeElement.closest('table')){
        render();
      }
    }
  });
  db.ref('memos').on('value', snap => {
    const val = snap.val();
    if(val && typeof val === 'object'){
      cloudMemos = val;
      localStorage.setItem('mh_memos7', JSON.stringify(val));
      // 메모 영역 입력 중이 아닐 때만 갱신
      if(!document.activeElement ||
         !document.activeElement.closest('.memo-wrap')){
        loadMemoUI();
      }
    }
  });
}

// ── PRESET + 저장 데이터 병합 ──
function getSlots(key){
  if(cloudSched[key]) return JSON.parse(JSON.stringify(cloudSched[key]));
  if(P[key])          return JSON.parse(JSON.stringify(P[key]));
  return [{slot:'',guest:'',prod:'',edit:'',upload:'',res:false,note:''}];
}
