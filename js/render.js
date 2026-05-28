// ── 화면 렌더링 ──

function timeOpts(v){return TIMES.map(t=>`<option value="${esc(t)}"${t===v?' selected':''}>${t||'-- 시간 --'}</option>`).join('');}
function prodOpts(v){return PRODUCERS.map(p=>`<option value="${esc(p)}"${p===v?' selected':''}>${p||'-- 제작자 --'}</option>`).join('');}
function editOpts(v){return EDITORS.map(e=>`<option value="${esc(e)}"${e===v?' selected':''}>${e||'-- 편집자 --'}</option>`).join('');}

function slotRowHTML(key, idx, s, isFirst, dateLabel, dow){
  const isToday = (key === toKey(new Date()));
  const isMobile = window.innerWidth <= 768;

  let rowCls = 'card-row';
  if(dow===1) rowCls += ' row-mon';
  if(dow===3) rowCls += ' row-wed';
  if(dow===5) rowCls += ' row-fri';
  if(dow===0) rowCls += ' row-sun';
  if(dow===6) rowCls += ' sat';
  if(isToday)  rowCls += ' today-row';

  const dateCls = dow===6 ? 'td-date sat-date' : dow===0 ? 'td-date sun-date' : 'td-date';
  const todayBadge = isToday ? '<span class="badge-today">오늘</span>' : '';

  if(isMobile){
    const dateTd = isFirst
      ? `<td class="${dateCls}">${esc(dateLabel)}${todayBadge}</td>`
      : `<td><span class="slot-label">2차 녹화</span></td>`;
    return `<tr class="${rowCls}" data-key="${key}" data-idx="${idx}">
      ${dateTd}
      <td data-label="녹화시간"><select class="f-slot">${timeOpts(s.slot)}</select></td>
      <td data-label="출연자"><textarea class="f-guest" rows="2" oninput="autoH(this)">${esc(s.guest)}</textarea></td>
      <td data-label="제작자"><select class="f-prod">${prodOpts(s.prod)}</select></td>
      <td data-label="편집자"><select class="f-edit">${editOpts(s.edit)}</select></td>
      <td data-label="업로드 아이템"><textarea class="f-upload" rows="2" oninput="autoH(this)">${esc(s.upload)}</textarea></td>
      <td data-label="리소스">
        <div class="res-cell-mobile">
          <input type="checkbox" id="res-${key}-${idx}" class="f-res" ${s.res?'checked':''}>
          <label for="res-${key}-${idx}">리소스 요청</label>
        </div>
      </td>
      <td data-label="특이사항"><textarea class="f-note" rows="2" oninput="autoH(this)">${esc(s.note)}</textarea></td>
      <td>${isFirst
        ? `<hr class="slot-divider"><button class="btn-add-slot" onclick="addSlot('${key}')">＋ 2차 녹화 추가</button>`
        : `<button class="btn-del" onclick="delSlot('${key}',${idx})">✕ 2차 삭제</button>`
      }</td>
    </tr>`;
  } else {
    const dateTd = isFirst
      ? `<td class="${dateCls}"><div class="date-cell-inner">
           <span>${esc(dateLabel)}${todayBadge}</span>
           <button class="btn-add-slot" onclick="addSlot('${key}')">＋ 2차 녹화</button>
         </div></td>`
      : `<td><span class="slot-label">2차</span></td>`;
    return `<tr class="${rowCls}" data-key="${key}" data-idx="${idx}">
      ${dateTd}
      <td><select class="f-slot">${timeOpts(s.slot)}</select></td>
      <td><textarea class="f-guest" oninput="autoH(this)">${esc(s.guest)}</textarea></td>
      <td><select class="f-prod">${prodOpts(s.prod)}</select></td>
      <td><select class="f-edit">${editOpts(s.edit)}</select></td>
      <td><textarea class="f-upload" oninput="autoH(this)">${esc(s.upload)}</textarea></td>
      <td class="res-cell"><input type="checkbox" class="f-res" ${s.res?'checked':''}></td>
      <td><textarea class="f-note" oninput="autoH(this)">${esc(s.note)}</textarea></td>
      <td>${!isFirst ? `<button class="btn-del" onclick="delSlot('${key}',${idx})">✕</button>` : '&nbsp;'}</td>
    </tr>`;
  }
}

function render(){
  const tb  = document.getElementById('tableBody');
  const ws  = weekStart;
  const we  = addDays(ws, 6);
  document.getElementById('weekTitle').textContent =
    `${ws.getMonth()+1}월 ${ws.getDate()}일 ~ ${we.getMonth()+1}월 ${we.getDate()}일`;

  let html = '';
  for(let i=0; i<7; i++){
    const d     = addDays(ws, i);
    const key   = toKey(d);
    const dow   = d.getDay();
    const slots = getSlots(key);
    slots.forEach((s, idx)=>{
      html += slotRowHTML(key, idx, s, idx===0, fmt(d), dow);
    });
  }
  tb.innerHTML = html;
  tb.querySelectorAll('textarea').forEach(ta=>autoH(ta));
  loadMemoUI();

  // thead sticky top 동적 계산
  const sh = document.getElementById('stickyTop').offsetHeight;
  const thead = document.querySelector('thead');
  if(thead) thead.style.top = sh+'px';
}
