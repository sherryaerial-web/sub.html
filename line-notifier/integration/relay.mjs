// Call only after the existing LINE handler verifies x-line-signature and parses events.
// Return value replaces payload before normal AI/webhook event processing.
export async function relayBindingEvents(rawBody, signature, payload, env, fetchImpl = fetch) {
  const url = env.CLOSURE_LINE_BINDING_URL;
  if (!url) return payload;
  const isBinding = event => event.type === 'message' && event.message?.type === 'text' && /^綁定關課(?:\s|$)/u.test(event.message.text?.trim() || '');
  if (!payload.events.some(isBinding)) return payload;
  if (!/^https:\/\/[a-zA-Z0-9.-]+\/line-binding$/.test(url)) throw new Error('Invalid binding endpoint');
  const response = await fetchImpl(url, { method: 'POST', signal: AbortSignal.timeout(8000), redirect: 'error',
    headers: { 'Content-Type': 'application/json', 'x-line-signature': signature }, body: rawBody });
  if (!response.ok) throw new Error('Binding relay unavailable');
  const result = await response.json();
  if (result.ok !== true) throw new Error('Binding relay rejected');
  return { ...payload, events: payload.events.filter(event => !isBinding(event)) };
}
