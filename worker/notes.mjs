import noteTranslations from '../data/noteTranslations.json' with {type:'json'};
import {cleanNoteDraft} from '../lib/note-design.mjs';
function noteJson(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
export function isNoteModerator(request,env){const actual=request.headers.get('oai-authenticated-user-email');return !!actual&&!!env.NOTE_MODERATOR_EMAIL&&actual.toLowerCase()===env.NOTE_MODERATOR_EMAIL.toLowerCase()}
async function tokenAdmin(request,env){const secret=env.NOTE_ADMIN_TOKEN;if(typeof secret!=='string'||secret.length<32)return false;const token=request.headers.get('Authorization')?.match(/^Bearer (.{32,200})$/)?.[1];if(!token)return false;const a=await noteHash(token),b=await noteHash(secret);let different=0;for(let i=0;i<a.length;i++)different|=a.charCodeAt(i)^b.charCodeAt(i);return different===0}
async function noteHash(text){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join('')}
export function allowedNoteOrigin(request,env){const origin=request.headers.get('Origin');return origin===new URL(request.url).origin||!!env.NOTE_ALLOWED_ORIGIN&&origin===env.NOTE_ALLOWED_ORIGIN}
function noteVisitor(request,env){const foreign=request.headers.get('Origin')!==new URL(request.url).origin;const external=foreign&&allowedNoteOrigin(request,env)?request.headers.get('X-Note-Visitor'):null;if(external&&/^[a-f0-9-]{36}$/.test(external))return external;return request.headers.get('Cookie')?.match(/(?:^|;\s*)note_visitor=([a-f0-9-]{36})(?:;|$)/)?.[1]}
function publicNote(n){return {id:n.id,message:n.message,from:n.sender,location:n.location,language:n.language,styleVariant:n.style_variant,textColor:n.text_color,stickers:JSON.parse(n.stickers),createdAt:n.created_at,status:n.status,visibility:n.visibility||'public',source:'remote'}}
async function noteBody(request){if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw Error('invalid_json');const reader=request.body?.getReader();if(!reader)throw Error('invalid_json');let count=0,out='';const decoder=new TextDecoder();for(;;){const {value,done}=await reader.read();if(done)break;count+=value.byteLength;if(count>4096){await reader.cancel();throw Error('too_large')}out+=decoder.decode(value,{stream:true})}out+=decoder.decode();return JSON.parse(out)}
const noteTranslationCache=new Map();
let noteTranslationRetryUntil=0;
export async function translateNote(request,fetcher=fetch,env={}){
 const origin=new URL(request.url).origin;
 if(request.method!=='POST')return noteJson({error:'method_not_allowed'},405);
 if(!allowedNoteOrigin(request,env))return noteJson({error:'origin_not_allowed'},403);
 let body;try{body=await noteBody(request)}catch{return noteJson({error:'invalid_json'},400)}
 const message=typeof body?.message==='string'?body.message.trim():'';
 if(!message||Array.from(message).length>60||!['zh-CN','ko','en'].includes(body?.target))return noteJson({error:'invalid_translation'},400);
 const builtIn=noteTranslations.find(note=>note.source===message)?.translations[body.target];if(builtIn)return noteJson({translation:builtIn});
 const key=JSON.stringify([message,body.target]),cached=noteTranslationCache.get(key);
 if(cached&&cached.until>Date.now())return noteJson({translation:cached.text});
 if(env.DEEPL_API_KEY||env.GOOGLE_TRANSLATE_API_KEY){
  try{
   const deepL=!!env.DEEPL_API_KEY,endpoint=deepL?(env.DEEPL_API_KEY.endsWith(':fx')?'https://api-free.deepl.com/v2/translate':'https://api.deepl.com/v2/translate'):'https://translation.googleapis.com/language/translate/v2';
   const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(deepL?{Authorization:'DeepL-Auth-Key '+env.DEEPL_API_KEY}:{'X-Goog-Api-Key':env.GOOGLE_TRANSLATE_API_KEY})},body:JSON.stringify(deepL?{text:[message],target_lang:{'zh-CN':'ZH',ko:'KO',en:'EN'}[body.target]}:{q:message,target:body.target,format:'text'}),signal:AbortSignal.timeout(8000)});
   if(!response.ok)return noteJson({error:'translation_unavailable'},503,response.status===429?{'Retry-After':response.headers.get('Retry-After')||'60'}:{});
   const data=await response.json(),text=deepL?data?.translations?.[0]?.text:data?.data?.translations?.[0]?.translatedText;
   if(typeof text!=='string'||!text.trim()||text.length>4000)throw Error('invalid_translation');
   const decoded=text.replace(/&(?:amp|quot|apos|lt|gt|#39);/g,entity=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&#39;':"'"}[entity]));
   if(noteTranslationCache.size>=300)noteTranslationCache.delete(noteTranslationCache.keys().next().value);
   noteTranslationCache.set(key,{text:decoded,until:Date.now()+3600000});return noteJson({translation:decoded});
  }catch{return noteJson({error:'translation_unavailable'},503)}
 }
 if(noteTranslationRetryUntil>Date.now())return noteJson({error:'translation_unavailable'},503,{'Retry-After':String(Math.ceil((noteTranslationRetryUntil-Date.now())/1000))});
 const providers=[{path:'/translate_a/t',client:'dict-chrome-ex',single:false},{path:'/translate_a/single',client:'gtx',single:true}];
 for(const provider of providers){
  try{
   const url=new URL('https://translate.googleapis.com'+provider.path);
   url.search=new URLSearchParams({client:provider.client,sl:'auto',tl:body.target,q:message,...(provider.single?{dt:'t'}:{})}).toString();
   const response=await fetcher(url,{headers:{Accept:'application/json','User-Agent':'CHENLE-UNIVERSE-Translation/1.0'},signal:AbortSignal.timeout(4000)});
   if(response.status===429){const retry=Math.min(3600,Math.max(1,Number(response.headers.get('Retry-After'))||60));noteTranslationRetryUntil=Date.now()+retry*1000;return noteJson({error:'translation_unavailable'},503,{'Retry-After':String(retry)})}
   if(!response.ok){console.warn('note_translation_upstream_http',{format:provider.single?'sentences':'dictionary',status:response.status});throw Error('upstream_http')}
   const data=await response.json();
   const text=provider.single&&Array.isArray(data?.[0])&&data[0].every(Array.isArray)?data[0].map(segment=>typeof segment?.[0]==='string'?segment[0]:'').join(''):typeof data?.[0]==='string'?data[0]:data?.[0]?.[0];
   if(typeof text!=='string'||!text.trim()||text.length>4000)throw Error('invalid_translation');
   if(noteTranslationCache.size>=300)noteTranslationCache.delete(noteTranslationCache.keys().next().value);
   noteTranslationCache.set(key,{text,until:Date.now()+3600000});return noteJson({translation:text});
  }catch{ /* Try the alternate response format from the same translation provider. */ }
 }
 return noteJson({error:'translation_unavailable'},503);

}
export async function notesApi(request,env){
 const url=new URL(request.url),path=url.pathname,admin=isNoteModerator(request,env)||await tokenAdmin(request,env);
 if(path==='/api/notes/translate')return translateNote(request,fetch,env);
 if(path==='/api/notes/access')return noteJson({moderator:admin});
 if(!env.DB)return noteJson({error:'storage_unavailable'},503);
 if(request.method==='GET'){
  if(path==='/api/notes/admin'){if(!admin)return noteJson({error:'forbidden'},403);const offset=Number(url.searchParams.get('offset')||0);if(!Number.isInteger(offset)||offset<0||offset>10000)return noteJson({error:'invalid_offset'},400);const rows=await env.DB.prepare("SELECT * FROM chenle_notes WHERE visibility = 'public' ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET ?").bind(offset).all();return noteJson({notes:rows.results.slice(0,50).map(publicNote),hasMore:rows.results.length>50})}
  if(path==='/api/notes/mine'){
   const visitor=noteVisitor(request,env);if(!visitor)return noteJson([]);const actor=await noteHash(url.origin+visitor);
   const rows=await env.DB.prepare('SELECT * FROM chenle_notes WHERE actor = ? ORDER BY created_at DESC LIMIT 30').bind(actor).all();return noteJson(rows.results.map(publicNote));
  }
  if(path!=='/api/notes')return noteJson({error:'not_found'},404);
  const pending=url.searchParams.get('status')==='pending';if(pending&&!admin)return noteJson({error:'forbidden'},403);
  const rows=await env.DB.prepare("SELECT * FROM chenle_notes WHERE status = ? AND visibility = 'public' ORDER BY created_at DESC LIMIT 100").bind(pending?'pending':'approved').all();return noteJson(rows.results.map(publicNote));
 }
 if(request.method!=='POST')return noteJson({error:'method_not_allowed'},405);
 if(!allowedNoteOrigin(request,env))return noteJson({error:'origin_not_allowed'},403);
 const visibilityMatch=path.match(/^\/api\/notes\/([a-f0-9-]{36})\/visibility$/);
 if(visibilityMatch){
  const visitor=noteVisitor(request,env);if(!visitor)return noteJson({error:'not_found'},404);
  let body;try{body=await noteBody(request)}catch{return noteJson({error:'invalid_json'},400)}
  if(!['public','private'].includes(body?.visibility))return noteJson({error:'invalid_visibility'},400);
  const actor=await noteHash(url.origin+visitor);
  const result=await env.DB.prepare("UPDATE chenle_notes SET visibility = ? WHERE id = ? AND actor = ? AND status = 'approved'").bind(body.visibility,visibilityMatch[1],actor).run();
  if(!result.meta.changes)return noteJson({error:'not_found'},404);
  const rows=await env.DB.prepare('SELECT * FROM chenle_notes WHERE id = ? AND actor = ?').bind(visibilityMatch[1],actor).all();return noteJson(publicNote(rows.results[0]));
 }
 const deleteMatch=path.match(/^\/api\/notes\/([a-f0-9-]{36})\/delete$/);
 if(deleteMatch){if(!admin)return noteJson({error:'forbidden'},403);const result=await env.DB.prepare("DELETE FROM chenle_notes WHERE id = ? AND visibility = 'public'").bind(deleteMatch[1]).run();return result.meta.changes?noteJson({ok:true}):noteJson({error:'not_found'},404)}
 const match=path.match(/^\/api\/notes\/([a-f0-9-]{36})\/moderate$/);
 if(match){
  if(!admin)return noteJson({error:'forbidden'},403);let body;try{body=await noteBody(request)}catch{return noteJson({error:'invalid_json'},400)}
  if(!['approved','rejected'].includes(body?.status))return noteJson({error:'invalid_status'},400);
  const result=await env.DB.prepare('UPDATE chenle_notes SET status = ? WHERE id = ?').bind(body.status,match[1]).run();return result.meta.changes?noteJson({ok:true}):noteJson({error:'not_found'},404);
 }
 if(path!=='/api/notes')return noteJson({error:'not_found'},404);
 let draft,visibility;try{const body=await noteBody(request);visibility=body?.visibility??'public';if(!['public','private'].includes(visibility))throw Error();draft=cleanNoteDraft(body)}catch{return noteJson({error:'invalid_note'},400)}
 const visitor=noteVisitor(request,env)||crypto.randomUUID(),actor=await noteHash(url.origin+visitor),day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),network=await noteHash(url.origin+day+(request.headers.get('CF-Connecting-IP')||visitor));
 const id=crypto.randomUUID(),createdAt=new Date().toISOString();
 const result=await env.DB.prepare("INSERT INTO chenle_notes (id,message,sender,location,language,style_variant,text_color,stickers,created_at,status,actor,network,day,visibility) SELECT ?,?,?,?,?,?,?,?,?,'approved',?,?,?,? WHERE (SELECT COUNT(*) FROM chenle_notes WHERE actor=? AND day=?)<5 AND (SELECT COUNT(*) FROM chenle_notes WHERE network=? AND day=?)<30").bind(id,draft.message,draft.from,draft.location,draft.language,draft.styleVariant,draft.textColor,JSON.stringify(draft.stickers),createdAt,actor,network,day,visibility,actor,day,network,day).run();
 const headers={'Set-Cookie':`note_visitor=${visitor}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`};
 return result.meta.changes?noteJson({...draft,id,createdAt,status:'approved',visibility,source:'remote'},201,headers):noteJson({error:'daily_limit'},429,headers);
}
