const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const root=require('node:path').resolve(__dirname,'..');
const src=fs.readFileSync(root+'/Code.gs','utf8');
const names=['cleanText_','isAdminRole_','normalizeManagementCapabilities_','getSessionTeacherName_','getSessionManagementCapabilities_','assertCapabilitySession_','withScriptLock_','raffleHash_','raffleColumns_','buildRaffleImportPreview_','raffleSourceConflictReason_','getRaffleConfiguration_','readRaffleLegacyCampaigns_','readRaffleTable_','readRaffleSeedClaims_','rafflePublicClaim_','rafflePickupInfo_','previewRaffleImport_','assertRafflePreparer_','raffleImportPlan_','readRaffleState_','readRaffleClaims_','raffleWriteContext_','rafflePriorResult_','appendRaffleEvent_','confirmRaffleImport_','applyRaffleClaimMutation_','mutateRaffleClaim_'];
function extract(name){const start=src.indexOf('function '+name+'(');if(start<0)throw Error(name);const next=src.indexOf('\nfunction ',start+1);return vm.runInNewContext('('+src.slice(start,next<0?src.length:next)+'\n)').toString();}
const production='var CONFIG={LOCK_TIMEOUT_MS:30000};\n'+src.match(/^var MANAGEMENT_CAPABILITIES = .*;$/m)[0]+'\n'+names.map(extract).join('\n\n');
const harness=fs.readFileSync(root+'/scripts/raffle-integration-sandbox.gs','utf8');
new vm.Script(production+'\n'+harness);
if(/\b(?:MailApp|GmailApp|UrlFetchApp)\s*\./.test(production))throw Error('Forbidden external service');
// Guard must reject before any write-capable service is reached.
for(const mode of ['project','sheet','marker']){
 const context=vm.createContext({ScriptApp:{getScriptId:()=>mode==='project'?'wrong':'10zm4vErpaK9kXskt9cQ4-zOmZGafgUwob4ZqiAM2uO0UUTDbcbiu7tKq'},SpreadsheetApp:{getActiveSpreadsheet:()=>({getId:()=>mode==='sheet'?'wrong':'1k_ULYH9PG1xt45Ncrtd6UjWU3yy9BbGPsLkXBdsbgFE',getSheetByName:()=>null})}});
 vm.runInContext(harness,context);let message='';try{context.runSandboxIntegration();}catch(e){message=e.message;}
 if(!/Wrong sandbox|Missing sandbox/.test(message))throw Error('guard failed: '+mode+':'+message);
}
const manifest={timeZone:'Asia/Taipei',runtimeVersion:'V8',exceptionLogging:'STACKDRIVER',oauthScopes:['https://www.googleapis.com/auth/spreadsheets']};
const payload={files:[{name:'appsscript',type:'JSON',source:JSON.stringify(manifest)},{name:'Sandbox',type:'SERVER_JS',source:harness},{name:'RaffleUnderTest',type:'SERVER_JS',source:production}]};
fs.writeFileSync('/private/tmp/raffle-integration-20261003/gas-payload.json',JSON.stringify(payload));
fs.writeFileSync('/private/tmp/raffle-integration-20261003/source-manifest.json',JSON.stringify({sourceCommit:'8d18d45',functions:names.map(name=>({name,sha256:crypto.createHash('sha256').update(extract(name)).digest('hex')})),mailCodeIncluded:false,realAccountAuthenticationTested:false},null,2));
console.log('PASS: syntax, three fail-closed environment guards, no mail/network service; extracted '+names.length+' unchanged production functions');
