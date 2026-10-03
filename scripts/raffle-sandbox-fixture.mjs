import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const dir='/private/tmp/raffle-integration-20261003';
await fs.mkdir(dir,{recursive:true});
const wb=Workbook.create();
const data={
 '測試說明':[['隔離測試','僅假資料，不寄信，不連正式系統'],['識別','raffle-sandbox-20261003-v1'],['來源版本','8d18d45'],['範圍','匯入、防重、領取、權限；不代表跨帳號驗收']],
 '抽獎名單':[
 ['OB email名稱','OB名字','驗證碼','中獎等級','最終選擇獎品','領取館別','領獎方式','確認時間','API購課ID','是否已使用(Yes/空白)','寄送e-mail(Yes/空格)','寄送日期'],
 ['ready@example.invalid','測試現貨','TEST-READY','A','測試提袋','晴光','choose_venue','2099-01-01','fake-ready','Yes','',''],
 ['wait@example.invalid','測試待貨','TEST-WAIT','A','測試護腰','劍潭','choose_venue','2099-01-01','fake-wait','Yes','',''],
 ['digital@example.invalid','測試電子','TEST-DIGITAL','A','測試電子券','','show_code','2099-01-01','fake-digital','Yes','',''],
 ['invite@example.invalid','測試邀請','TEST-INVITE','','','','','','fake-invite','','','']],
 '獎項設定':[['獎項ID','獎項等級','獎品名稱','領獎方式'],['test-bag','A','測試提袋','choose_venue'],['test-belt','A','測試護腰','choose_venue'],['test-digital','A','測試電子券','show_code']]
};
for(const [name,rows] of Object.entries(data)){
 const s=wb.worksheets.add(name);s.showGridLines=false;
 const r=s.getRangeByIndexes(0,0,rows.length,rows[0].length);r.values=rows;
 r.format.font={name:'Arial',size:11};r.format.rowHeight=28;r.format.columnWidth=24;
 s.getRangeByIndexes(0,0,1,rows[0].length).format.fill='#EEEEEE';
 if(name==='測試說明')s.getRange('B1:B4').format.columnWidth=65;
 wb.recalculate();
 const p=await wb.render({sheetName:name,autoCrop:'all',scale:1,format:'png'});
 await fs.writeFile(`${dir}/${name}.png`,new Uint8Array(await p.arrayBuffer()));
}
console.log((await wb.inspect({kind:'sheet',include:'id,name'})).ndjson);
await (await SpreadsheetFile.exportXlsx(wb)).save(`${dir}/raffle-sandbox.xlsx`);
