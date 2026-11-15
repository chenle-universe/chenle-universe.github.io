import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translateNote,notesApi} from '../worker/notes.mjs';
const origin='https://notes.example';
const request=(body,extra={})=>new Request(origin+'/api/notes/translate',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
let calls=0;
const provider=async url=>{calls++;assert.equal(url.hostname,'translate.googleapis.com');assert.equal(url.searchParams.get('sl'),'auto');assert.equal(url.pathname,'/translate_a/t');assert.equal(url.searchParams.get('client'),'dict-chrome-ex');assert.equal(url.searchParams.get('tl'),'ko');assert.equal(url.searchParams.get('q'),'生日快乐！');return Response.json([['생일 축하해요!','zh-CN']])};
assert.equal((await translateNote(request({message:'生日快乐！',target:'ko'}),provider)).status,200);
assert.deepEqual(await(await translateNote(request({message:'生日快乐！',target:'ko'}),provider)).json(),{translation:'생일 축하해요!'});assert.equal(calls,1,'Repeated translations use cached text');
for(const target of ['zh-CN','en'])assert.equal((await translateNote(request({message:'테스트',target}),async()=>Response.json(['test']))).status,200);
for(const body of [{message:' ',target:'en'},{message:'a'.repeat(61),target:'en'},{message:'test',target:'fr'}])assert.equal((await translateNote(request(body),provider)).status,400);
assert.equal((await translateNote(request({message:'test',target:'en'},{Origin:'https://foreign.example'}),provider)).status,403);
assert.equal((await translateNote(new Request(origin+'/api/notes/translate'),provider)).status,405);
assert.equal((await translateNote(request({message:'malformed',target:'en'}),async()=>Response.json({text:'wrong'}))).status,503);
assert.equal((await notesApi(request({message:'',target:'en'}),{})).status,400,'Translation route does not require note database');
const ui=readFileSync('components/WordsForChenle.tsx','utf8'),translation=readFileSync('components/NoteTranslation.tsx','utf8');assert.ok(ui.includes('<NoteTranslation message={active.message} lang={lang}/>'));assert.ok(!ui.includes('noteTranslationUrl'));assert.ok(!translation.includes('target="_blank"'));assert.ok(translation.includes('current.signal.aborted'));assert.ok(translation.includes('aria-live="polite"'));assert.ok(!translation.includes('AbortSignal.any'));assert.ok(translation.includes('clearTimeout(timeout)'));
console.log('PASS: inline translation, language targets, auto-detect request, cache, stale request cancellation, route validation, provider errors and original note preserved.');

let fallbackCalls=0;
assert.deepEqual(await(await translateNote(request({message:'fallback case',target:'en'}),async url=>{fallbackCalls++;return url.pathname.endsWith('/t')?new Response('',{status:503}):Response.json([[['Fallback translation','x']],null,'en'])})).json(),{translation:'Fallback translation'});assert.equal(fallbackCalls,2);
assert.deepEqual(await(await translateNote(request({message:'multiple sentences',target:'en'}),async()=>Response.json([[['First sentence. ','x'],['Second sentence.','y']],null,'en']))).json(),{translation:'First sentence. Second sentence.'});
let limitedCalls=0;const limited=await translateNote(request({message:'quota case',target:'en'}),async()=>{limitedCalls++;return new Response('',{status:429,headers:{'Retry-After':'120'}})});assert.equal(limited.status,503);assert.equal(limited.headers.get('Retry-After'),'120');assert.equal(limitedCalls,1,'Respect upstream rate limits without retrying');
console.log('PASS: complete multi-sentence translation, same-provider format fallback and upstream rate-limit handling.');

const examples=JSON.parse(readFileSync('data/noteTranslations.json','utf8'));for(const note of examples)for(const target of ['zh-CN','ko','en']){const result=await translateNote(request({message:note.source,target}),async()=>{throw Error('Offline example must not call an upstream')});assert.equal(result.status,200);assert.equal((await result.json()).translation,note.translations[target])}
let officialCalls=0;const official=await translateNote(request({message:'official Google test',target:'ko'}),async(url,options)=>{officialCalls++;assert.equal(url,'https://translation.googleapis.com/language/translate/v2');assert.equal(options.headers['X-Goog-Api-Key'],'test-key');assert.equal(JSON.parse(options.body).target,'ko');return Response.json({data:{translations:[{translatedText:'번역 &amp; 확인'}]}})},{GOOGLE_TRANSLATE_API_KEY:'test-key'});assert.deepEqual(await official.json(),{translation:'번역 & 확인'});assert.equal(officialCalls,1);
const deep=await translateNote(request({message:'official DeepL test',target:'zh-CN'}),async(url,options)=>{assert.equal(url,'https://api-free.deepl.com/v2/translate');assert.equal(options.headers.Authorization,'DeepL-Auth-Key test-key:fx');assert.equal(JSON.parse(options.body).target_lang,'ZH');return Response.json({translations:[{text:'测试译文'}]})},{DEEPL_API_KEY:'test-key:fx'});assert.deepEqual(await deep.json(),{translation:'测试译文'});
console.log('PASS: all example notes translate offline; official Google and DeepL keys remain server-only; translated entity decoding.');

assert.equal((await translateNote(request({message:'failure',target:'en'}),async()=>new Response('',{status:429}))).status,503);
