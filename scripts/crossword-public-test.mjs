import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {crosswordQuestions,crosswordTitle} from '../data/crossword.ts';
import {createCrosswordModel,wordKeys,correctWordIds,nextHint,pasteAnswer,normalizeAnswer,sanitizeCrosswordValues} from '../lib/crossword-game.mjs';
import {migrateCrosswordProgress,CROSSWORD_VERSION,CROSSWORD_STORAGE_KEY,WORLD_STORAGE_KEY,LEGACY_CROSSWORD_KEYS} from '../lib/crossword-progress.mjs';
const layout=JSON.parse(readFileSync('data/crossword-layout.json','utf8'));
const {cells,fixed}=createCrosswordModel(layout);
assert.equal(crosswordQuestions.length,12);assert.equal(layout.placements.length,12);
assert.deepEqual([...layout.placements.map(p=>p.id)].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));
assert.deepEqual(new Set(layout.placements.map(p=>p.d)),new Set([0,1]));
const occupied=new Map(),starts=new Map();
for(const p of layout.placements){
 assert.equal(p.word,crosswordQuestions[p.id][0]);assert.match(p.word,/^[A-Z]+$/);
 assert.ok(p.r>=0&&p.c>=0&&p.r+(p.d?p.word.length:1)<=layout.height&&p.c+(p.d?1:p.word.length)<=layout.width);
 for(const [i,k] of wordKeys(p).entries()){const prior=occupied.get(k);if(prior)assert.equal(prior.ch,p.word[i]);occupied.set(k,{ch:p.word[i],ids:[...(prior?.ids||[]),p.id]})}
 const start=`${p.r},${p.c}`;if(starts.has(start))assert.equal(starts.get(start),p.number);starts.set(start,p.number);
 assert.ok(crosswordQuestions[p.id].slice(1).every(s=>s.trim().length>8),'Both languages must contain full questions and comments');
}
// Enumerate every actual run from the grid, independently of the generator.
const runs=[];for(const [key] of occupied){const [r,c]=key.split(',').map(Number);for(const d of [0,1]){
 const previous=`${r-(d?1:0)},${c-(d?0:1)}`;if(occupied.has(previous))continue;let word='',i=0;
 while(occupied.has(`${r+(d?i:0)},${c+(d?0:i)}`)){word+=occupied.get(`${r+(d?i:0)},${c+(d?0:i)}`).ch;i++}
 if(word.length>1)runs.push({word,r,c,d});
}}
assert.equal(runs.length,12,'No extra hidden words or illegal runs');
for(const run of runs)assert.ok(layout.placements.some(p=>p.word===run.word&&p.r===run.r&&p.c===run.c&&p.d===run.d));
// Traverse the word graph: no disconnected island can pass.
const seen=new Set([layout.placements[0].id]);for(let n=0;n<12;n++)for(const cell of occupied.values())if(cell.ids.some(id=>seen.has(id)))cell.ids.forEach(id=>seen.add(id));assert.equal(seen.size,12);
assert.ok(Math.abs(fixed.length/Object.keys(cells).length-.2)<.015);
assert.equal(correctWordIds(layout,cells,fixed,{}).length,0,'Prefilled letters cannot award solved words');
assert.equal(normalizeAnswer('Chewing Gum'),'CHEWINGGUM');assert.equal(normalizeAnswer('Chewing-Gum!'),'CHEWINGGUM');
const chewing=layout.placements.find(p=>p.word==='CHEWINGGUM'),keys=wordKeys(chewing);
const pasted=pasteAnswer(keys,keys[0],'chewing gum',{},fixed);assert.ok(correctWordIds(layout,cells,fixed,pasted).includes(chewing.id));
const full={};for(const [k,cell] of Object.entries(cells))if(!fixed.includes(k))full[k]=cell.ch;
assert.equal(correctWordIds(layout,cells,fixed,full).length,12);
const editable=keys.find(k=>!fixed.includes(k)),wrong={...full,[editable]:'?'};
assert.ok(!correctWordIds(layout,cells,fixed,wrong).includes(chewing.id));assert.equal(nextHint(keys,cells,fixed,wrong),editable);
wrong[editable]=cells[editable].ch;assert.equal(correctWordIds(layout,cells,fixed,wrong).length,12);assert.equal(nextHint(keys,cells,fixed,wrong),undefined);
assert.deepEqual(sanitizeCrosswordValues({'999,999':'A',[editable]:'BAD'},cells,fixed),{});
function storage(seed={}){const data=new Map(Object.entries(seed));return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),data}}
const previous={lang:'ko',visited:true,stars:['years','hoops','gacha','eyes','crossword']};
const st=storage({[WORLD_STORAGE_KEY]:JSON.stringify(previous),[LEGACY_CROSSWORD_KEYS[0]]:JSON.stringify(full),[CROSSWORD_STORAGE_KEY]:JSON.stringify(full),'other-game-key':'unchanged'});
const migrated=migrateCrosswordProgress(st);assert.deepEqual(migrated.stars,['years','hoops','gacha','eyes']);assert.equal(migrated.lang,'ko');assert.equal(migrated.visited,true);assert.equal(migrated.crosswordVersion,CROSSWORD_VERSION);assert.equal(st.getItem(CROSSWORD_STORAGE_KEY),null);assert.equal(st.getItem(LEGACY_CROSSWORD_KEYS[0]),null);assert.equal(st.getItem('other-game-key'),'unchanged');
const current={...migrated,stars:[...migrated.stars,'crossword']};st.setItem(WORLD_STORAGE_KEY,JSON.stringify(current));st.setItem(CROSSWORD_STORAGE_KEY,JSON.stringify(full));assert.deepEqual(migrateCrosswordProgress(st),current);assert.equal(JSON.parse(st.getItem(CROSSWORD_STORAGE_KEY))[editable],full[editable]);
assert.deepEqual(migrateCrosswordProgress(storage({[WORLD_STORAGE_KEY]:'broken JSON'})).stars,[]);
const require=createRequire(import.meta.url);for(const extension of ['.ts','.tsx'])require.extensions[extension]=(mod,file)=>{const result=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,resolveJsonModule:true}});mod._compile(result.outputText,file)};
const Game=require('../components/CrosswordGame.tsx').default,Reaction=require('../components/CrosswordReaction.tsx').default;
for(const lang of ['zh','ko']){
 const markup=renderToStaticMarkup(React.createElement(Game,{lang,onComplete(){throw Error('Must not award star during render')}}));
 assert.ok(markup.includes(crosswordTitle));assert.ok(!markup.includes('12 questions. One Chenle. Too many random facts.'));assert.ok(!markup.includes('12 TMI QUESTIONS')); assert.ok(markup.includes(lang==='zh'?'检查答案':'정답 확인'));assert.ok(markup.includes(lang==='zh'?'给我提示':'힌트 보기'));assert.equal((markup.match(/class="compact-clue/g)||[]).length,layout.placements.filter(p=>p.d===0).length);
 for(let id=0;id<12;id++){const reaction=renderToStaticMarkup(React.createElement(Reaction,{id,lang,onClose(){}}));assert.ok(reaction.includes('CHENLE FUN FACT'));assert.ok(reaction.includes(crosswordQuestions[id][lang==='zh'?3:4]));}
}
const text=readFileSync('data/content.ts','utf8')+readFileSync('data/crossword.ts','utf8')+readFileSync('data/crosswordUi.ts','utf8')+readFileSync('data/crosswordReactions.ts','utf8');
assert.ok(!/Vika|PARIS|FRANCE|NOVEMBER|ENTJ|REDBEAN|我们第一次|우리 둘|我们俩|巴黎所在|埃菲尔铁塔/i.test(text));
console.log(`PASS: ${layout.width}×${layout.height}; 12 exact Across/Down runs; all crossings and connectedness; ${fixed.length}/${occupied.size} prefilled (${Math.round(100*fixed.length/occupied.size)}%); full-word paste, hint/check, both-language UI and 24 fun facts; stale answers/star migration and current-progress retention.`);
