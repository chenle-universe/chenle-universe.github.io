import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),source=ts.transpileModule(readFileSync('components/NoteTranslation.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const states=[],refs=[],effects=[],timers=new Map();let stateIndex=0,refIndex=0,timerId=0,pending=[];
const hooks={useState(initial){const i=stateIndex++;if(!(i in states))states[i]=initial;return [states[i],next=>states[i]=next]},useRef(initial){const i=refIndex++;return refs[i]??(refs[i]={current:initial})},useEffect(fn){effects.push(fn)}};
const module={exports:{}};
vm.runInNewContext(source,{exports:module.exports,require:name=>name==='react'?hooks:name==='../lib/site-network'?{siteFetch:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}:require(name),AbortController,setTimeout:fn=>{const id=++timerId;timers.set(id,fn);return id},clearTimeout:id=>timers.delete(id)});
const Component=module.exports.default;
function render(message){stateIndex=0;refIndex=0;return Component({message,lang:'zh'})}
function translate(tree){return tree.props.children[1].props.children[1].props.onClick()}
let tree=render('原文甲');for(const effect of effects.splice(0))effect();
const first=translate(tree);assert.equal(states[2],true);
render('原文乙');for(const effect of effects.splice(0))effect();pending.shift().resolve(Response.json({translation:'stale result'}));await first;assert.equal(states[1],'','Stale response cannot replace a different note');
tree=render('原文乙');effects.length=0;const second=translate(tree);pending.shift().resolve(Response.json({translation:'new translation'}));await second;assert.equal(states[1],'new translation');assert.equal(states[2],false);assert.equal(timers.size,0);
tree=render('超时原文');for(const effect of effects.splice(0))effect();const timed=translate(tree);for(const fn of timers.values())fn();pending.shift().reject(new Error('timeout'));await timed;assert.equal(states[2],false);assert.equal(states[3],true);assert.equal(render('超时原文').props.children[0].props.children,'超时原文','Timeout retains original text');
const network=ts.transpileModule(readFileSync('lib/site-network.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,net={exports:{}};let calls=0;
vm.runInNewContext(network,{exports:net.exports,process:{env:{NEXT_PUBLIC_API_ORIGIN:'https://backend.example'}},Headers,fetch:(url,options)=>{calls++;assert.equal(url,'https://backend.example/api/notes/translate');assert.equal(options.credentials,'omit');return Promise.resolve(Response.json({translation:'ok'}))},localStorage:{getItem(){throw Error('Storage blocked')}}});await net.exports.siteFetch('/api/notes/translate',{method:'POST'});assert.equal(calls,1);
console.log('PASS: translation without AbortSignal.any; stale-response protection; timer cleanup; timeout restores controls and original text; translation works with blocked local storage.');
