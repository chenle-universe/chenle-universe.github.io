import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,filename)=>module._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
const {chenleFortunes:cards,fortuneDisclaimer}=require('../data/chenleFortunes.ts');
const {chooseFortune}=require('../lib/chenle-fortune.ts');
const Result=require('../components/gacha/FortuneGachaResult.tsx').default;
assert.equal(cards.length,20);assert.equal(new Set(cards.map(c=>c.id)).size,20);
assert.deepEqual(cards.map(c=>c.luckyNumber),[30,1122,7,7,22,25,11,1000,88,7,22,16,4,3,100,7,22,8,1122,999]);
assert.deepEqual(cards.map(c=>c.luckyItem),['篮球','小狗爪印','小海豚','AirPods','麦克风','耳机','土豆','银色星星','钢琴键','七角星','笑脸贴纸','计划清单','饭碗','游戏手柄','相机','拍立得','音符','枕头','生日蛋糕','大头皇冠']);
for(const previous of [null,...cards.map(c=>c.id)]){
 const eligible=cards.filter(c=>c.id!==previous);
 for(let i=0;i<eligible.length;i++)assert.equal(chooseFortune(cards,previous,()=>(i+.5)/eligible.length),eligible[i],'Equal probability buckets select complete records, including card 20');
}
let previous=null;for(let i=0;i<10000;i++){const card=chooseFortune(cards,previous);assert.notEqual(card.id,previous);assert.ok(cards.includes(card));previous=card.id;}
assert.throws(()=>chooseFortune([],null));
for(const fortune of cards){
 assert.equal(fortune.title,fortune.titleZh);assert.equal(fortune.message,fortune.messageZh);assert.equal(fortune.luckyItem,fortune.luckyItemZh);
 for(const lang of ['zh','ko']){
 const html=renderToStaticMarkup(React.createElement(Result,{fortune,lang,capsuleSrc:'/test-capsule.webp',edge:0,onAgain:()=>{}}));
 for(const text of [lang==='zh'?fortune.titleZh:fortune.titleKo,lang==='zh'?fortune.messageZh:fortune.messageKo,lang==='zh'?fortune.luckyItemZh:fortune.luckyItemKo,String(fortune.luckyNumber),'ONE MORE?','CHENLE FORTUNE',fortuneDisclaimer[lang]])assert.ok(html.includes(text),`${fortune.id} ${lang}: full matched text`);
 assert.ok(!html.includes(fortune.id));assert.ok(!html.includes('memory-photo-window'));assert.ok(!html.includes('fortune-note-photo'));assert.ok(!html.includes('<img'));
 }
}
const machine=readFileSync('components/GachaMachine.tsx','utf8');assert.ok(machine.includes('controller.current!.play(setStep, () => complete.current())'));assert.ok(machine.includes('if (controller.current!.busy) return'));assert.ok(machine.includes('onAgain={turn}'));assert.ok(!machine.includes('memoryGachaPhotos'));
const css=readFileSync('app/gacha-studio.css','utf8').split('/* Content-only fortune edition:')[1];assert.ok(css.includes('height:auto'));assert.ok(!css.includes('line-clamp'));assert.ok(!css.includes('text-overflow'));
console.log('PASS: 20 bilingual complete fortunes, matching items/numbers, uniform reachable buckets, 10,000 non-repeating draws, 40 localized result renders, redraw/reward wiring and uncropped responsive styles.');
