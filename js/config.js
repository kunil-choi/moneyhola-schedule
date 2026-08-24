// ── API 및 팀 설정 ──
const PRODUCERS = ['', '양영은', '최건일'];
const EDITORS   = ['', '박채빈', '김태환', '외주'];
const TIMES     = ['', ...(function(){
                   const list=[];
                   for(let m=9*60; m<=17*60+30; m+=30){
                     list.push(String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'));
                   }
                   return list;
                 })(), '이어서','-'];
const DAY_KO = ['일','월','화','수','목','금','토'];

function toKey(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function addDays(d,n){
  const r=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  r.setDate(r.getDate()+n);
  return r;
}
function getMon(d){
  const r=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const dw=r.getDay();
  r.setDate(r.getDate()+(dw===0?-6:1-dw));
  return r;
}
function fmt(d){
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${DAY_KO[d.getDay()]})`;
}
function esc(s){
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function autoH(ta){
  if(!ta)return;
  ta.style.height='auto';
  ta.style.height=ta.scrollHeight+'px';
}
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2400);
}
