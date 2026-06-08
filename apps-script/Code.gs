// ── 머니올라 캘린더 동기화 ──

const CALENDAR_ID  = 'gaegoo99@gmail.com';
const FIREBASE_URL = 'https://moneyhola-schedule-default-rtdb.asia-southeast1.firebasedatabase.app';

// ── 유틸: 캘린더 색상 ──
function getColor(prod) {
  if (prod === '최건일') return CalendarApp.EventColor.YELLOW;
  if (prod === '양영은') return CalendarApp.EventColor.RED;
  return CalendarApp.EventColor.CYAN;
}

// ── 특정 날짜 동기화 (저장 버튼 연동) ──
function syncDateToCalendar(dateKey, slots) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    Logger.log('캘린더를 찾을 수 없습니다: ' + CALENDAR_ID);
    return;
  }
  if (!slots || !Array.isArray(slots)) {
    Logger.log('유효하지 않은 슬롯 데이터: ' + dateKey);
    return;
  }

  const parts = dateKey.split('-');
  const year  = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day   = parseInt(parts[2]);
  const targetDay = new Date(year, month, day);

  // 해당 날짜의 기존 녹화 이벤트 삭제
  calendar.getEventsForDay(targetDay)
    .filter(e => e.getTitle().startsWith('🎬'))
    .forEach(e => e.deleteEvent());

  // 새 이벤트 등록
  slots.forEach((slot, idx) => {
    // 슬롯, 출연자, 제작자 없으면 건너뜀
    if (!slot.slot || !slot.guest) return;
    if (slot.slot === '-' || slot.slot === '') return;
    if (slot.prod !== '최건일' && slot.prod !== '양영은') return;

    // 시작 시간 파싱
    let startHour = 10, startMin = 30;
    if (slot.slot !== '이어서') {
      const timeParts = slot.slot.split(':');
      if (timeParts.length === 2) {
        startHour = parseInt(timeParts[0]);
        startMin  = parseInt(timeParts[1]);
      }
    }

    const startTime = new Date(year, month, day, startHour, startMin, 0);
    const endTime   = new Date(year, month, day, startHour + 2, startMin, 0);

    const slotLabel = idx > 0 ? ' [2차]' : '';
    const prodText  = slot.prod  ? ` / 제작: ${slot.prod}`  : '';
    const editText  = slot.edit  ? ` / 편집: ${slot.edit}`  : '';
    const noteText  = slot.note  ? `\n특이사항: ${slot.note}` : '';

    const title = `🎬 ${slot.guest} 녹화${slotLabel}`;
    const desc  = `출연자: ${slot.guest}${prodText}${editText}${noteText}`;

    const ev = calendar.createEvent(title, startTime, endTime, { description: desc });
    ev.setColor(getColor(slot.prod));

    Logger.log(`캘린더 등록: ${title} (${dateKey}) / 색상: ${slot.prod}`);
  });
}

// ── 전체 동기화 (수동 실행용) ──
function syncToCalendar() {
  const res  = UrlFetchApp.fetch(FIREBASE_URL + '/schedule.json');
  const data = JSON.parse(res.getContentText());
  if (!data) { Logger.log('Firebase 데이터 없음'); return; }

  Object.keys(data).forEach(dateKey => {
    syncDateToCalendar(dateKey, data[dateKey]);
  });
  Logger.log('전체 동기화 완료');
}

// ── 웹앱 엔드포인트 ──
function doGet(e) {
  const action  = e.parameter.action  || '';
  const dateKey = e.parameter.dateKey || '';

  if (action === 'sync' && dateKey) {
    try {
      const res   = UrlFetchApp.fetch(FIREBASE_URL + '/schedule/' + dateKey + '.json');
      const slots = JSON.parse(res.getContentText());
      syncDateToCalendar(dateKey, slots);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, dateKey: dateKey }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'syncAll') {
    try {
      syncToCalendar();
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, action: 'syncAll' }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, msg: 'action 파라미터 필요 (sync 또는 syncAll)' }))
    .setMimeType(ContentService.MimeType.JSON);
}
