// Google Apps Script 서버 코드
// 이 파일은 참고용입니다.
// 실제 실행: https://script.google.com 에서 배포

const SHEET_ID    = '1yvd8w57DnnUUQAKB2YypqyKQpeGjmvP6MJesEm7ppYc';
const SCHED_SHEET = 'schedule';
const MEMO_SHEET  = 'memos';

function getOrCreate(name){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh   = ss.getSheetByName(name);
  if(!sh) sh = ss.insertSheet(name);
  return sh;
}

function doGet(e){
  const type = (e.parameter.type === 'memo') ? MEMO_SHEET : SCHED_SHEET;
  const sh   = getOrCreate(type);
  const data = sh.getRange(1,1).getValue();
  return ContentService
    .createTextOutput(data || '{}')
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  try{
    let payload;
    if(e.postData.type === 'application/x-www-form-urlencoded'){
      const raw = decodeURIComponent(e.postData.contents.replace(/\+/g,' '));
      payload   = JSON.parse(raw.replace(/^payload=/,''));
    } else {
      payload = JSON.parse(e.postData.contents);
    }
    const type = (payload.type === 'memo') ? MEMO_SHEET : SCHED_SHEET;
    const sh   = getOrCreate(type);
    sh.getRange(1,1).setValue(JSON.stringify(payload.data));
    return ContentService
      .createTextOutput(JSON.stringify({ok:true}))
      .setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService
      .createTextOutput(JSON.stringify({ok:false, error:err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
