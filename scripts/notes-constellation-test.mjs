import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,file)=>{module._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file)};
const {noteStarPositions,noteStarAppearance,noteMeteorKinds}=require('../lib/note-constellation.ts');
const {chenleMessages}=require('../data/chenleMessages.ts');
const Component=require('../components/NotesConstellation.tsx').default;
assert.equal(noteStarPositions.length,10);assert.equal(noteMeteorKinds.length,6);
for(const [w,h] of [[290,590],[360,590],[900,650]])for(let i=0;i<10;i++){
 const [x,y]=noteStarPositions[i];assert.ok(x*w/100>=30&&w-x*w/100>=30);assert.ok(y*h/100>=40&&h-y*h/100>=40);
 for(let j=i+1;j<10;j++){const [a,b]=noteStarPositions[j];assert.ok(Math.hypot((x-a)*w/100,(y-b)*h/100)>=72,'Touch targets remain separated on mobile and desktop')}
}
assert.deepEqual(noteStarAppearance('stable-id'),noteStarAppearance('stable-id'));
for(const lang of ['zh','ko']){
 const html=renderToStaticMarkup(React.createElement(Component,{notes:chenleMessages,lang,onOpen(){},status(){return ''}}));
 assert.equal((html.match(/class="note-message-star"/g)||[]).length,chenleMessages.length);
 assert.equal((html.match(/class="notes-meteor meteor-/g)||[]).length,6);
 for(const n of chenleMessages){assert.ok(html.includes(n.from));assert.ok(!html.includes(n.message),'Messages stay inside the reader until the user opens a star')}
 assert.ok(html.includes('aria-pressed="false"'));assert.ok(!html.includes('EXAMPLE'));assert.ok(html.includes('notes-meteors" aria-hidden="true"'));
}
const css=readFileSync('app/notes-sky.css','utf8');assert.ok(css.includes('prefers-reduced-motion:reduce'));assert.ok(css.includes('.sky-still .notes-meteor{display:none}'));assert.ok(css.includes('.note-message-star:focus-visible'));
const page=readFileSync('components/WordsForChenle.tsx','utf8');assert.ok(page.includes('<NotesConstellation notes={visible} lang={lang} onOpen={open} status={status}/>'));assert.ok(page.includes("view==='write'?'notes-compose-view':'notes-sky-view'"));
console.log('PASS: three initial clickable message stars, six related meteor heads, no closed-message text exposed, deterministic positions, separated mobile/desktop targets, keyboard focus, pause control and reduced-motion styles.');
