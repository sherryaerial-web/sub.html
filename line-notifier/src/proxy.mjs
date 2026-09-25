import { bridgeSignature } from '../integration/bridge.mjs';
export async function proxyLine(env,action,value) {
  if(!env.LINE_PROXY||!env.BRIDGE_SECRET)throw new Error('LINE proxy unavailable');
  const path='/internal/closure-line/'+action;
  const timestamp=Date.now(),payload=JSON.stringify(value);
  const signature=await bridgeSignature(env.BRIDGE_SECRET,`${timestamp}\n${path}\n${payload}`);
  return env.LINE_PROXY.fetch(new Request('https://line-internal'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({timestamp,payload,signature}),signal:AbortSignal.timeout(18000)}));
}
