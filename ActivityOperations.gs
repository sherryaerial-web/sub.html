// Read-only management aggregates. No student profile, reward or stock writes.
function getActivityOperations_(session) {
  assertCapabilitySession_(session, 'raffle_admin');
  var p = PropertiesService.getScriptProperties(), key = p.getProperty('PRODUCTION_TASK_APP_SECRET');
  if (ScriptApp.getScriptId() !== '16OHrdGSCR9sDXkbyttJK7_y4QVg7Hela1fhs4hiIPFgUHwQ-Q2NunnsW' || !key || key.length < 32 || key.length > 256) throw Error('活動狀態尚未設定完成。');
  var data;
  try {
    var response = UrlFetchApp.fetch('https://sherry-activity-production.sherry-line-ai.workers.dev/internal/operations', {
      method:'post', contentType:'application/json', followRedirects:false, muteHttpExceptions:true,
      headers:{'x-production-task-app-secret':key}, payload:JSON.stringify({action:'status'})
    });
    var text = response.getContentText();
    if (response.getResponseCode() !== 200 || text.length > 32768) throw Error();
    data = JSON.parse(text);
    if (data.ok !== true || data.campaignId !== 'christmas-2026' || !Array.isArray(data.tasks) || data.tasks.length !== 4 || !data.sources || !data.queues || !Number.isSafeInteger(data.checkedAt)) throw Error();
  } catch (_) { throw Error('暫時無法讀取活動執行狀態；這不代表沒有異常，請稍後更新。'); }
  var mail = {available:true, queued:0, uncertain:0, oldestPendingAt:null};
  try {
    readRaffleMailState_().jobs.filter(function(j) { return j.campaignId === 'christmas-2026'; }).forEach(function(j) {
      if (j.status === 'queued') mail.queued++;
      if (j.status === 'sending' || j.status === 'uncertain') mail.uncertain++;
      if (['queued','sending','uncertain'].indexOf(j.status) >= 0) {
        var at = Date.parse(j.createdAt);
        if (Number.isFinite(at)) mail.oldestPendingAt = mail.oldestPendingAt === null ? at : Math.min(mail.oldestPendingAt, at);
      }
    });
  } catch (_) { mail = {available:false}; }
  var stockAt = Date.parse(p.getProperty('RAFFLE_STOCK_APP_LAST_SUCCESS') || '');
  data.classroom = {lineFirst:p.getProperty('RAFFLE_READY_LINE_FIRST_ENABLED') === 'true', testOnly:p.getProperty('RAFFLE_READY_LINE_FIRST_TEST_ONLY') !== 'false', lastStockSyncAt:Number.isFinite(stockAt)?stockAt:null, mail:mail};
  return data;
}

// Editor-only, idempotent configuration; not exposed as a Web App action.
function enableGeneralReadyAndOperations20261031() {
  if (ScriptApp.getScriptId() !== '16OHrdGSCR9sDXkbyttJK7_y4QVg7Hela1fhs4hiIPFgUHwQ-Q2NunnsW') throw Error('Wrong project');
  var p = PropertiesService.getScriptProperties(), key = p.getProperty('PRODUCTION_TASK_APP_SECRET');
  if (!key || key.length < 32 || key.length > 256) throw Error('Bridge not configured');
  p.setProperties({RAFFLE_READY_LINE_FIRST_ENABLED:'true', RAFFLE_READY_LINE_FIRST_TEST_ONLY:'false'}, false);
  var result = {lineFirst:p.getProperty('RAFFLE_READY_LINE_FIRST_ENABLED') === 'true', testOnly:p.getProperty('RAFFLE_READY_LINE_FIRST_TEST_ONLY') !== 'false', messagesSent:0};
  console.log(JSON.stringify(result));
  return result;
}
