// Standalone owner-run smoke test. No Web App, triggers, Sheets or raffle data.
// Approved 2026-10-03 for exactly one fixed recipient. Never reset this property.
function getApprovedSmokeTestStatus() {
  var raw = PropertiesService.getScriptProperties().getProperty('SHERRY_APPROVED_MAIL_SMOKE_20261003');
  if (!raw) return {status: 'not_started', recipient: 'm605330912@icloud.com'};
  var state;
  try { state = JSON.parse(raw); } catch (error) { throw new Error('測試寄信紀錄損壞，停止操作。'); }
  if (!state || ['sending','accepted','uncertain'].indexOf(state.status) < 0 || state.recipient !== 'm605330912@icloud.com') throw new Error('測試寄信紀錄異常，停止操作。');
  return state;
}

function sendApprovedSmokeTest() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var prior = getApprovedSmokeTestStatus();
    if (prior.status !== 'not_started') { console.log(JSON.stringify(prior)); return prior; }
    if (!(MailApp.getRemainingDailyQuota() >= 1)) throw new Error('寄信配額不足，尚未寄出。');
    var props = PropertiesService.getScriptProperties();
    var state = {status: 'sending', recipient: 'm605330912@icloud.com', startedAt: new Date().toISOString()};
    props.setProperty('SHERRY_APPROVED_MAIL_SMOKE_20261003', JSON.stringify(state));
    try {
      MailApp.sendEmail({
        to: 'm605330912@icloud.com',
        subject: '【Sherry 系統測試｜非抽獎通知】寄信功能確認',
        name: 'Sherry Aerial Studio｜系統測試',
        body: '冠蓉您好：\n\n這是您同意寄送的一封系統測試信，用來確認 Google Apps Script 能否寄信至您的 iCloud 信箱。\n\n目前沒有抽獎活動。這不是抽獎邀請、中獎或領獎通知，沒有抽獎資格或獎品需要處理。\n\n本次沒有匯入學生名單、建立抽獎活動、登記待寄名單，也沒有寄給其他人。\n\n收到後，請回到原對話告訴我「收到了」即可，不需要回覆這封信。\n\n測試識別：SHERRY-MAIL-SMOKE-20261003\nSherry Aerial Studio'
      });
      state.status = 'accepted';
      state.acceptedAt = new Date().toISOString();
      props.setProperty('SHERRY_APPROVED_MAIL_SMOKE_20261003', JSON.stringify(state));
      console.log(JSON.stringify(state));
      return state;
    } catch (error) {
      state.status = 'uncertain';
      try { props.setProperty('SHERRY_APPROVED_MAIL_SMOKE_20261003', JSON.stringify(state)); } catch (ignored) {}
      throw new Error('測試寄送結果不明，禁止自動重寄；請先核對收件匣及執行紀錄。');
    }
  } finally { lock.releaseLock(); }
}
