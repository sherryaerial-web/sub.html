(function(root) {
  'use strict';
  const palettes = Object.freeze([
    {id:'original',label:'原本配色',primary:'#786c64',secondary:'#eee0dc',surface:'#fffdf9',page:'#f3f0eb',nav:'#ebe5dd',ink:'#403936',muted:'#776f68',line:'#d8d0c7',edge:'#ad8175',strong:'#665851'},
    {id:'rose',label:'藕粉 × 暖灰',primary:'#857377',secondary:'#e9dcdf',surface:'#fdfaf9',page:'#f3efee',nav:'#eae3e2',ink:'#443d3f',muted:'#756b6d',line:'#d9ced0',edge:'#b59b9f',strong:'#6e5b61'},
    {id:'sage',label:'鼠尾草 × 米白',primary:'#717a70',secondary:'#dfe5dd',surface:'#fcfcf8',page:'#f0f1eb',nav:'#e5e8df',ink:'#3c433c',muted:'#6b7369',line:'#cfd5cb',edge:'#a1ad9c',strong:'#596753'},
    {id:'blue',label:'霧藍 × 珍珠灰',primary:'#707c83',secondary:'#dfe5e8',surface:'#fafbfc',page:'#eef1f2',nav:'#e3e8eb',ink:'#3d4246',muted:'#6a7379',line:'#cdd5d9',edge:'#9aaeb7',strong:'#53656f'},
    {id:'lilac',label:'灰紫 × 淡藕',primary:'#7b7482',secondary:'#e5dfe9',surface:'#fcfafc',page:'#f1eef3',nav:'#e8e2ea',ink:'#423e46',muted:'#726b77',line:'#d5ceda',edge:'#ac9eb6',strong:'#65586e'},
    {id:'stone',label:'石灰 × 霧白',primary:'#737675',secondary:'#e2e5e3',surface:'#fbfbf9',page:'#f0f1ee',nav:'#e6e7e3',ink:'#3e4140',muted:'#6e736f',line:'#d1d5d1',edge:'#a3aca6',strong:'#59635c'}
  ].map(Object.freeze));
  const fields = ['schemaVersion','mode','presetId','primary','secondary','revision','updatedAt'];
  const hex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  const clone = value => value ? {...value} : null;
  function defaultPreference() {
    return {schemaVersion:1,mode:'preset',presetId:'original',primary:'#786c64',secondary:'#eee0dc',revision:0,updatedAt:''};
  }
  function validate(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).length !== fields.length || Object.keys(value).some(k => !fields.includes(k)) ||
        value.schemaVersion !== 1 || !['preset','custom'].includes(value.mode) ||
        !Number.isSafeInteger(value.revision) || value.revision < 0 ||
        !hex(value.primary) || !hex(value.secondary) || typeof value.updatedAt !== 'string') return null;
    const palette = palettes.find(p => p.id === value.presetId);
    if (!palette || (value.mode === 'preset' &&
        (value.primary.toLowerCase() !== palette.primary || value.secondary.toLowerCase() !== palette.secondary))) return null;
    if (value.revision === 0 ? value.updatedAt !== '' :
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.updatedAt) || !Number.isFinite(Date.parse(value.updatedAt))) return null;
    return {...value,primary:value.primary.toLowerCase(),secondary:value.secondary.toLowerCase()};
  }
  const sameContent = (a,b) => !!a && !!b && ['mode','presetId','primary','secondary'].every(k => a[k] === b[k]);
  const rgb = color => color.slice(1).match(/../g).map(v => parseInt(v,16));
  function mix(a,b,amount) {
    const other=rgb(b);
    return '#' + rgb(a).map((v,i) => Math.round(v*(1-amount)+other[i]*amount).toString(16).padStart(2,'0')).join('');
  }
  function luminance(color) {
    return rgb(color).map(v => v/255).map(v => v <= .04045 ? v/12.92 : Math.pow((v+.055)/1.055,2.4))
      .reduce((sum,v,i) => sum + v*[.2126,.7152,.0722][i],0);
  }
  const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  const foreground = (color,preferred) => contrast(preferred,color)>=4.5 ? preferred :
    contrast('#000000',color) >= contrast('#ffffff',color) ? '#000000' : '#ffffff';
  function readable(color,backgrounds) {
    let value=color;
    for (let i=0;i<100 && backgrounds.some(bg => contrast(value,bg)<4.5);i++) value=mix(value,'#000000',.08);
    return value;
  }
  function themeTokens(value) {
    const p=validate(value) || defaultPreference(), base=palettes.find(b => b.id===p.presetId), original=base.id==='original';
    const {surface,page,nav}=base;
    const soft=original?'#f7f3ee':mix(base.secondary,'#ffffff',.82);
    const aqua100=p.mode==='preset'?p.secondary:mix(p.secondary,'#ffffff',.88);
    const aqua50=original && p.mode==='preset'?'#f6efeb':mix(p.secondary,'#ffffff',.95);
    const backgrounds=[surface,page,nav,soft,aqua100,aqua50];
    return {
      '--ink':base.ink,
      '--muted':readable(base.muted,backgrounds),
      '--subtle':readable(original?'#938781':mix(base.muted,'#ffffff',.15),backgrounds),
      '--line':base.line,
      '--line-strong':original?'#bfb4aa':mix(base.primary,'#ffffff',.45),
      '--surface':surface,'--page':page,'--soft':soft,
      '--sea-800':base.strong,
      '--sea-700':readable(p.primary,backgrounds),
      '--sea-600':readable(original?'#8f7d74':p.primary,backgrounds),
      '--aqua-100':aqua100,'--aqua-50':aqua50,
      '--appearance-primary':p.primary,'--appearance-on-primary':foreground(p.primary,'#fffdf9'),
      '--appearance-secondary':p.secondary,'--appearance-on-secondary':foreground(p.secondary,base.strong),
      '--appearance-nav':nav,'--appearance-edge':base.edge
    };
  }
  function createController(options) {
    options=options || {};
    let storage;
    try { storage=options.storage === undefined ? root.localStorage : options.storage; } catch (_) { /* Cache is optional. */ }
    const request=options.request, onChange=options.onChange || function() {};
    let session={owner:'',token:'',verified:false,acting:false}, generation=0, readId=0;
    let preference=defaultPreference(), draft=null, isOpen=false, loading=false, saving=null;
    let knownRevision=false, edited=false, status='idle', message='', uncertain=null, reloadRequired=false;
    const eligible = () => session.verified && !!session.owner && !!session.token;
    const editable = () => eligible() && !session.acting && isOpen && !saving && !uncertain;
    const cacheKey = () => 'sherry-personal-appearance-v1:' + encodeURIComponent(session.owner);
    function readCache() {
      try { return validate(JSON.parse(storage && storage.getItem(cacheKey()) || 'null')); } catch (_) { return null; }
    }
    function writeCache() {
      try { if (storage) storage.setItem(cacheKey(),JSON.stringify(preference)); } catch (_) { /* A confirmed cloud save still succeeded. */ }
    }
    function snapshot() {
      return {preference:clone(preference),draft:clone(draft),isOpen,busy:loading || !!saving,needsReconciliation:!!uncertain,
        canSave:!!(eligible() && !session.acting && isOpen && !loading && !saving && knownRevision && status !== 'conflict' && (uncertain || edited)),status,message};
    }
    function emit() { const state=snapshot();onChange(state);return snapshot(); }
    function setSession(value) {
      value=value || {};
      const next={owner:typeof value.owner==='string'?value.owner:'',token:typeof value.token==='string'?value.token:'',verified:value.verified===true,acting:value.acting || false};
      const changed=next.owner!==session.owner || next.token!==session.token || next.verified!==session.verified;
      const actingChanged=next.acting!==session.acting;
      session=next;
      if (changed) {
        generation++;readId++;loading=false;saving=null;uncertain=null;reloadRequired=false;knownRevision=false;isOpen=false;draft=null;edited=false;
        preference=eligible() ? readCache() || defaultPreference() : defaultPreference();status='idle';message='';
      } else if (actingChanged) {
        isOpen=false;draft=null;edited=false;
        status=saving?'saving':uncertain?'uncertain':knownRevision?'ready':'idle';
        message=saving || uncertain?'先前儲存結果仍待確認。':'';
      }
      return emit();
    }
    async function load() {
      if (!eligible() || saving || uncertain) return snapshot();
      const epoch=generation, id=++readId, token=session.token, reload=status==='conflict' || reloadRequired, draftAtStart=draft;
      loading=true;knownRevision=false;status='loading';message='讀取配色中。';emit();
      try {
        const result=await request('getPersonalAppearance',{sessionToken:token});
        if (epoch!==generation || id!==readId) return snapshot();
        const next=result && result.available===true && validate(result.preference);
        if (!next) throw Error('配色目前無法同步，請重新讀取或聯繫管理員。');
        preference=next;knownRevision=true;reloadRequired=false;
        if (isOpen && (!edited || (reload && draft===draftAtStart))) {draft=clone(preference);edited=false;}
        status=edited?'dirty':'ready';message=edited?'尚未儲存。':'';
      } catch (error) {
        if (epoch!==generation || id!==readId) return snapshot();
        status='error';message='配色尚未同步，暫時無法儲存。' + (error && error.message || '');
      }
      loading=false;return emit();
    }
    function open() {
      if (!eligible() || session.acting) return Promise.resolve(snapshot());
      if (!isOpen) {isOpen=true;draft=clone(uncertain ? uncertain.draft : preference);edited=!!uncertain;emit();}
      return load();
    }
    function changed() {
      edited=!sameContent(draft,preference);
      if (!loading && status!=='conflict') {status=knownRevision?(edited?'dirty':'ready'):'error';message=knownRevision?(edited?'尚未儲存。':''):'配色尚未同步，暫時無法儲存。';}
      return emit();
    }
    function setPreset(id) {
      const palette=palettes.find(p=>p.id===id);
      if (!editable() || !palette) return snapshot();
      draft={...draft,mode:'preset',presetId:id,primary:palette.primary,secondary:palette.secondary};return changed();
    }
    function setColor(name,color) {
      if (!editable() || !['primary','secondary'].includes(name) || !hex(color)) return snapshot();
      draft={...draft,mode:'custom',[name]:color.toLowerCase()};return changed();
    }
    function cancel() {
      isOpen=false;draft=null;edited=false;
      if (saving || uncertain) {status=saving?'saving':'uncertain';message='已結束預覽，先前儲存結果仍待確認。';}
      else if (!loading) {status=knownRevision?'ready':'idle';message='';}
      return emit();
    }
    function save() {
      if (saving) return saving.promise;
      if (!snapshot().canSave) return Promise.resolve(snapshot());
      const epoch=generation, submitted=uncertain || {draft:clone(draft),params:{sessionToken:session.token,preference:JSON.stringify(draft),expectedRevision:draft.revision}};
      const slot={promise:null};saving=slot;readId++;loading=false;status='saving';message='儲存中。';emit();
      slot.promise=(async function() {
        try {
          const result=await request('savePersonalAppearance',{...submitted.params});
          if (epoch!==generation) return snapshot();
          if (result && result.saved===false) {
            uncertain=null;
            if (result.reason==='conflict') {
              const current=validate(result.current);if (current) preference=current;
              knownRevision=false;reloadRequired=true;status='conflict';message='其他裝置已更新配色，請重新讀取後再修改。';
            } else {status='error';message='配色未儲存，請重新讀取後再試。';}
          } else {
            const confirmed=result && result.saved===true && validate(result.preference);
            if (!confirmed || !sameContent(confirmed,submitted.draft) || confirmed.revision<submitted.draft.revision) throw Error('儲存結果未確認，請核對原操作。');
            preference=confirmed;knownRevision=true;uncertain=null;edited=false;
            if (isOpen) draft=clone(preference);
            writeCache();status='saved';message='配色已儲存。';
          }
        } catch (error) {
          if (epoch!==generation) return snapshot();
          const detail=error && error.message || String(error);
          if (/^已解除舊操作的確認紀錄，本次未送出/.test(detail)) {
            uncertain=null;knownRevision=false;reloadRequired=true;status='error';message='原操作已核對，請重新讀取配色後再修改。';
          } else {
            // Receipt storage can fail before sending OR after a successful server write.
            const storageFailure=/無法保存操作確認編號|紀錄無法讀取|storage|quota|security|denied/i.test(detail);
            uncertain=submitted;status=storageFailure?'error':'uncertain';
            message=storageFailure?'操作確認紀錄無法存取，儲存結果尚未確認；請恢復儲存權限後核對原操作。':'儲存結果待確認，請勿變更內容重送。'+detail;
          }
        }
        if (epoch===generation && saving===slot) {saving=null;return emit();}
        return snapshot();
      })();
      return slot.promise;
    }
    return {setSession,load,open,setPreset,setColor,reset:()=>setPreset('original'),cancel,save,snapshot};
  }
  const api={palettes,defaultPreference,themeTokens,createController};
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  else root.SherryPersonalAppearance=api;
})(typeof window!=='undefined'?window:globalThis);
