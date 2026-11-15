import {downloadPackage} from './download.mjs';
import {notesApi,allowedNoteOrigin} from './notes.mjs';
const ids=new Set(['happy','music','health','dream','smile','together']);
function json(data,status=200,extra={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}})}
async function digest(v){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function wishes(request,env){
 if(!env.DB)return json({error:'storage_unavailable'},503);
 if(request.method==='GET'){
  const [rows,total]=await Promise.all([env.DB.prepare('SELECT id, wish_id, created_at FROM fan_wishes ORDER BY created_at DESC, id DESC LIMIT 60').all(),env.DB.prepare('SELECT COUNT(*) AS total FROM fan_wishes').first()]);
  return json({wishes:rows.results,total:total.total});
 }
 if(request.method!=='POST')return json({error:'method_not_allowed'},405,{'Allow':'GET, POST'});
 const origin=new URL(request.url).origin;
 if(!allowedNoteOrigin(request,env))return json({error:'origin_not_allowed'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'json_required'},415);
 if(Number(request.headers.get('Content-Length')||0)>256)return json({error:'too_large'},413);
 const reader=request.body?.getReader();if(!reader)return json({error:'invalid_json'},400);let bytes=0,chunks=[];
 for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>256){await reader.cancel();return json({error:'too_large'},413)}chunks.push(value)}
 let data;try{const all=new Uint8Array(bytes);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length}data=JSON.parse(new TextDecoder().decode(all))}catch{return json({error:'invalid_json'},400)}
 if(!ids.has(data?.wishId))return json({error:'invalid_wish'},400);
 const day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Shanghai'}),cookie=request.headers.get('Cookie')?.match(/(?:^|;\s*)fan_visitor=([a-f0-9-]{36})(?:;|$)/)?.[1],visitor=(allowedNoteOrigin(request,env)&&request.headers.get('X-Note-Visitor')?.match(/^[a-f0-9-]{36}$/)?.[0])||cookie||crypto.randomUUID();
 const actor=await digest(origin+visitor),network=await digest(origin+day+(request.headers.get('CF-Connecting-IP')||visitor));
 // One public wish per visitor/day, plus a bounded shared-network rate limit.
 const result=await env.DB.prepare('INSERT OR IGNORE INTO fan_wishes (id,wish_id,actor,network,day,created_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM fan_wishes WHERE network = ? AND day = ?) < 30').bind(crypto.randomUUID(),data.wishId,actor,network,day,Date.now(),network,day).run();
 const headers={'Set-Cookie':`fan_visitor=${visitor}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`};
 return result.meta.changes?json({ok:true},201,headers):json({error:'daily_limit'},429,{...headers,'Retry-After':'86400'});
}
export default {async fetch(request,env){const requestOrigin=request.headers.get('Origin'),cors=!!env.NOTE_ALLOWED_ORIGIN&&requestOrigin===env.NOTE_ALLOWED_ORIGIN;const corsHeaders={'Access-Control-Allow-Origin':requestOrigin||'','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Note-Visitor','Access-Control-Max-Age':'600','Vary':'Origin'};if(request.method==='OPTIONS')return new Response(null,{status:cors?204:403,headers:cors?corsHeaders:{}});const response=await handle(request,env);if(!cors)return response;const headers=new Headers(response.headers);for(const [key,value] of Object.entries(corsHeaders))headers.set(key,value);return new Response(response.body,{status:response.status,headers})}};
async function handle(request,env){try{const path=new URL(request.url).pathname;if(path==='/downloads/chenle-universe-deploy.zip')return await downloadPackage(request,env);if(path==='/api/notes'||path.startsWith('/api/notes/'))return await notesApi(request,env);if(path==='/api/wishes')return await wishes(request,env);if(path.startsWith('/api/'))return json({error:'not_found'},404);if(!env.ASSETS)return new Response('Static assets are unavailable',{status:503});return env.ASSETS.fetch(request)}catch{return json({error:'temporarily_unavailable'},503)}}
