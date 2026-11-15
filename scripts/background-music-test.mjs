import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync('lib/useBackgroundMusic.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function setup(saved){
 const handlers=new Map(),effects=[],states=[],storage=new Map(saved===undefined?[]:[['chenle-bgm-enabled',saved]]);let audio;
 class FakeAudio{
  plays=0;pauses=0;fail=false;events=new Map();
  constructor(src){this.src=src;audio=this}play(){this.plays++;return this.fail?Promise.reject(new Error('blocked')):Promise.resolve()}pause(){this.pauses++}load(){}removeAttribute(){this.src=''}addEventListener(k,v){this.events.set(k,v)}removeEventListener(k){this.events.delete(k)}
 }
 const document={hidden:false,addEventListener:(k,v)=>handlers.set(k,v),removeEventListener:k=>handlers.delete(k)};
 const module={exports:{}};
 const react={useRef:value=>({current:value}),useCallback:fn=>fn,useState:value=>{const i=states.length;states.push(value);return [value,next=>states[i]=next]},useEffect:fn=>effects.push(fn)};
 vm.runInNewContext(code,{exports:module.exports,require:name=>{assert.equal(name,'react');return react},Audio:FakeAudio,document,KeyboardEvent:class{},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
 const result=module.exports.useBackgroundMusic(),cleanup=effects[0]();
 return {audio,result,states,storage,document,cleanup,handlers,click:(toggle=false)=>handlers.get('click')({target:{closest:()=>toggle}})};
}
const s=setup();assert.equal(s.audio.plays,0,'No playback before gesture');assert.equal(s.audio.loop,true);assert.equal(s.audio.volume,.28);assert.equal(s.audio.src,'/audio/next-favorite-day.mp3');
s.click();assert.equal(s.audio.plays,1);s.click();assert.equal(s.audio.plays,1,'Navigation clicks do not restart playback');
s.result.setSound(false);s.click();assert.equal(s.audio.plays,1,'Other clicks respect manual pause');assert.equal(s.storage.get('chenle-bgm-enabled'),'false');
s.result.setSound(true);s.document.hidden=true;s.handlers.get('visibilitychange')();assert.ok(s.audio.pauses>=2);s.document.hidden=false;s.handlers.get('visibilitychange')();assert.equal(s.audio.plays,3);
s.cleanup();assert.equal(s.handlers.size,0);assert.equal(s.audio.src,'');
const muted=setup('false');muted.click();assert.equal(muted.audio.plays,0);muted.result.setSound(true);assert.equal(muted.audio.plays,1);muted.cleanup();
const toggle=setup();toggle.click(true);assert.equal(toggle.audio.plays,0);toggle.result.setSound(true);toggle.result.setSound(false);toggle.click();assert.equal(toggle.audio.plays,1);toggle.cleanup();
const failure=setup();failure.audio.fail=true;failure.click();await Promise.resolve();assert.equal(failure.states[0],false,'Playback rejection returns the control to paused');failure.cleanup();
console.log('PASS: gesture playback, looping, continuous navigation, persistent mute, manual toggle, hidden-page pause/resume, rejection and cleanup.');
