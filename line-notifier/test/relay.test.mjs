import test from 'node:test';
import assert from 'node:assert/strict';
import { relayBindingEvents } from '../integration/relay.mjs';
const normal={type:'message',message:{type:'text',text:'課表'}};
const bind={type:'message',source:{type:'user'},message:{type:'text',text:'綁定關課 '+ 'a'.repeat(32)}};
test('binding relay forwards original signature/body and removes only binding from AI events',async()=>{
  const payload={events:[bind,normal]}; const raw=JSON.stringify(payload); const calls=[];
  const result=await relayBindingEvents(raw,'original-signature',payload,{CLOSURE_LINE_BINDING_URL:'https://notify.example/line-binding'},async(url,opts)=>{calls.push({url,...opts});return new Response('{"ok":true}');});
  assert.deepEqual(result.events,[normal]);assert.equal(calls[0].body,raw);assert.equal(calls[0].headers['x-line-signature'],'original-signature');
});
test('ordinary messages and disabled relay untouched; failure blocks binding from AI',async()=>{
  const fail=async()=>{throw new Error('offline');};
  assert.deepEqual(await relayBindingEvents('{}','s',{events:[normal]},{},fail),{events:[normal]});
  assert.deepEqual(await relayBindingEvents('{}','s',{events:[bind]},{},fail),{events:[bind]});
  await assert.rejects(relayBindingEvents('{}','s',{events:[bind]},{CLOSURE_LINE_BINDING_URL:'https://notify.example/line-binding'},fail));
});
