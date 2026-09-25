import test from 'node:test';
import assert from 'node:assert/strict';
import { handleBridge } from '../integration/bridge.mjs';
import { proxyLine } from '../src/proxy.mjs';
const secret='b'.repeat(40);
function setup() {
  const calls=[];
  const env={CLOSURE_LINE_BRIDGE_SECRET:secret,LINE_CHANNEL_SECRET:'line-secret',LINE_CHANNEL_ID:'channel',CLOSURE_LINE_SEND_ENABLED:'false'};
  const fetchImpl=async(url,options)=>{calls.push({url,...options});return Response.json(url.includes('/token')?{access_token:'private-token'}:{endpoint:'https://live.example/webhook',active:true});};
  return {env,calls,proxy:{BRIDGE_SECRET:secret,LINE_PROXY:{fetch:r=>handleBridge(r,env,{fetchImpl})}}};
}
test('bridge validates original LINE signature without exposing existing credentials',async()=>{
  const s=setup();
  const {sign}=await import('../src/index.mjs');
  const raw='{"events":[]}';
  const result=await proxyLine(s.proxy,'verify',{raw,signature:await sign(s.env.LINE_CHANNEL_SECRET,raw,'base64')});
  assert.deepEqual(await result.json(),{valid:true});assert.equal(s.calls.length,0);
  assert.equal((await (await proxyLine(s.proxy,'verify',{raw,signature:'bad'})).json()).valid,false);
});
test('bridge requires separate signature; info is read-only; push defaults disabled',async()=>{
  const s=setup();
  const bad=await handleBridge(new Request('https://internal/internal/closure-line/info',{method:'POST',body:'{}'}),s.env);
  assert.equal(bad.status,401);
  const info=await proxyLine(s.proxy,'info',{});assert.equal(info.status,200);
  assert.ok(!JSON.stringify(await info.json()).includes('private-token'));
  const push=await proxyLine(s.proxy,'push',{to:'U'+'1'.repeat(32),text:'test',retryKey:crypto.randomUUID()});
  assert.equal(push.status,503);assert.equal(s.calls.filter(c=>c.url.includes('/message/push')).length,0);
});
test('enabled bridge preserves retry key and uses existing channel only',async()=>{
  const s=setup();s.env.CLOSURE_LINE_SEND_ENABLED='true';
  const retryKey=crypto.randomUUID();
  const response=await proxyLine(s.proxy,'push',{to:'U'+'1'.repeat(32),text:'exact',retryKey,expires:Date.now()+60000});
  assert.equal(response.status,200);
  const push=s.calls.find(c=>c.url.includes('/message/push'));
  assert.equal(push.headers['X-Line-Retry-Key'],retryKey);
  assert.equal(JSON.parse(push.body).messages[0].text,'exact');
});
test('token exchange crossing the deadline never initiates a late push',async()=>{
  const s=setup();s.env.CLOSURE_LINE_SEND_ENABLED='true';let now=Date.now();let pushes=0;
  s.proxy.LINE_PROXY.fetch=r=>handleBridge(r,s.env,{now:()=>now,fetchImpl:async(url)=>{
    if(url.includes('/token')){now+=2000;return Response.json({access_token:'private'});}
    pushes++;return Response.json({ok:true});
  }});
  const response=await proxyLine(s.proxy,'push',{to:'U'+'1'.repeat(32),text:'late',retryKey:crypto.randomUUID(),expires:now+1000});
  assert.equal(response.status,410);assert.equal(pushes,0);
});
