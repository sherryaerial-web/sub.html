const encode = new TextEncoder();
export async function bridgeSignature(secret, text) {
  const key=await crypto.subtle.importKey('raw',encode.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC',key,encode.encode(text)))));
}
function same(a,b) {if(typeof a!=='string'||a.length!==b.length)return false;let d=0;for(let i=0;i<b.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
const reply=(v,status=200,headers={})=>Response.json(v,{status,headers:{'Cache-Control':'no-store',...headers}});
export async function handleBridge(request,env,deps={}) {
  const now=deps.now||Date.now;
  const path=new URL(request.url).pathname;
  if(!path.startsWith('/internal/closure-line/'))return null;
  if(request.method!=='POST')return reply({error:'method'},405);
  const secret=env.CLOSURE_LINE_BRIDGE_SECRET;
  if(!secret||secret.length<32)return reply({error:'unavailable'},503);
  let e;try{const raw=await request.text();if(raw.length>40000)return reply({error:'size'},413);e=JSON.parse(raw);}catch{return reply({error:'unauthorized'},401);}
  if(!Number.isSafeInteger(e.timestamp)||Math.abs(now()-e.timestamp)>300000||typeof e.payload!=='string'||
    !same(e.signature,await bridgeSignature(secret,`${e.timestamp}\n${path}\n${e.payload}`)))return reply({error:'unauthorized'},401);
  let p;try{p=JSON.parse(e.payload);}catch{return reply({error:'invalid'},400);}
  if(!p||typeof p!=='object')return reply({error:'invalid'},400);
  if(path.endsWith('/verify')) {
    if(typeof p.raw!=='string'||!env.LINE_CHANNEL_SECRET)return reply({valid:false});
    return reply({valid:same(p.signature,await bridgeSignature(env.LINE_CHANNEL_SECRET,p.raw))});
  }
  if(path!=='/internal/closure-line/info'&&path!=='/internal/closure-line/push')return reply({error:'not_found'},404);
  if(path.endsWith('/push')) {
    if(env.CLOSURE_LINE_SEND_ENABLED!=='true')return reply({error:'disabled'},503);
    if(!Number.isSafeInteger(p.expires)||p.expires<=now())return reply({error:'expired'},410);
    if(!/^U[a-f0-9]{32}$/.test(p.to||'')||typeof p.text!=='string'||!p.text.trim()||p.text.length>5000||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(p.retryKey||''))return reply({error:'invalid'},422);
  }
  const fetchImpl=deps.fetchImpl||fetch;
  try {
    let token=env.LINE_CHANNEL_ACCESS_TOKEN;
    if(!token) {
      const r=await fetchImpl('https://api.line.me/oauth2/v3/token',{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:env.LINE_CHANNEL_ID,client_secret:env.LINE_CHANNEL_SECRET}).toString()});
      if(!r.ok)return reply({error:'line_auth'},502);
      token=(await r.json()).access_token;
      if(!token)return reply({error:'line_auth'},502);
    }
    if(path.endsWith('/info')) {
      const r=await fetchImpl('https://api.line.me/v2/bot/channel/webhook/endpoint',{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(8000)});
      if(!r.ok)return reply({error:'line_info'},502);
      const info=await r.json();return reply({endpoint:info.endpoint,active:info.active});
    }
    if(now()>=p.expires)return reply({error:'expired'},410);
    const r=await fetchImpl('https://api.line.me/v2/bot/message/push',{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,'X-Line-Retry-Key':p.retryKey},body:JSON.stringify({to:p.to,messages:[{type:'text',text:p.text}]})});
    const headers={};for(const k of ['x-line-accepted-request-id','retry-after'])if(r.headers.get(k))headers[k]=r.headers.get(k);
    return reply({ok:r.ok},r.status,headers);
  }catch{return reply({error:'line_transport'},502);}
}
