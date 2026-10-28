const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {setup}=require('./helpers/raffle-mail-fixture');
const ui=()=>{const c={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../raffle.js'),'utf8'),c);return c.window.SherryRaffle;};
test('email escapes student content, keeps readable body and only links HTTPS',()=>{
 const s=setup(),html=s.c.renderRaffleEmailHtml_('<聖誕>','您好 <img src=x onerror=alert(1)>\n\n活動網站：https://example.com/raffle?a=1&b=2\njavascript:alert(1)');
 assert.match(html,/&lt;聖誕&gt;/);assert.ok(!html.includes('<img'));assert.match(html,/href="https:\/\/example.com\/raffle\?a=1&amp;b=2"/);assert.ok(!html.includes('href="javascript:'));assert.match(html,/請勿直接回覆/);
});
test('direct pickup requires no venue selection; delivery still requires matching venue',()=>{
 const a=ui();const direct=a.renderPickupVenue({venue:'教室現貨'});assert.ok(!direct.includes('<select'));assert.match(direct,/type="hidden"/);assert.match(direct,/value="教室現貨"/);
 assert.match(a.renderPickupVenue({venue:'晴光'}),/<select/);assert.match(a.renderPickupVenue({venue:'晴光'}),/其他館別/);
});
test('teacher view distinguishes remaining from already collected and not-ready items',()=>{
 const a=ui(),base={studentKey:'s',studentName:'學生',maskedEmail:'s***@a.com',campaignId:'c',id:'x',quantity:3,claimedQuantity:1,prizeName:'球',venue:'教室現貨',status:'partial'};
 const html=a.renderClaims([base],[],{readOnly:false});assert.match(html,/尚可領取 2 件/);assert.match(html,/已領取 1 件/);
 const waiting=a.renderClaims([{...base,status:'waiting',claimedQuantity:0}],[],{readOnly:false});assert.ok(!waiting.includes('data-raffle-action="collect"'));assert.match(waiting,/尚未備妥/);
});
