import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import sharp from 'sharp';
import {DIRECTIONS,gazeDirection,normalizeGaze,actualDirection,CharacterTimeline,FrameAtlas,ChenleSpriteAnimator} from '../lib/character/ChenleSpriteAnimator.mjs';
const map=JSON.parse(readFileSync('public/characters/chenle/animation-map.json','utf8'));
assert.equal(map.source.frameCount,217);assert.equal(map.source.fps,24);assert.equal(map.frames.length,217);
assert.equal(map.cellSize,448);assert.equal(map.atlases.length,28);
assert.equal(map.originalHorizontalSheet.generated,false);assert.equal(map.originalHorizontalSheet.requiredWidth,97216);
for(const direction of DIRECTIONS){assert.ok(map.states[direction]);assert.equal(map.states[direction].available,['center','left'].includes(direction));if(!map.states[direction].available){assert.deepEqual(map.states[direction].frames,[]);assert.ok(map.states[direction].reason);assert.ok('replacement' in map.states[direction]);}}
assert.equal(map.states.expressionPout.available,false);
for(const state of Object.values(map.states))for(const id of state.frames)assert.ok(id>=0&&id<217);
const origins=new Set();
for(const f of map.frames){assert.equal(f.index,f.sourceFrame-1);assert.ok(Math.abs(f.sourceTime-f.index/24)<.000001);const a=map.atlases[f.atlas];assert.ok(f.x+f.width<=a.width&&f.y+f.height<=a.height);assert.equal(f.width,448);assert.equal(f.height,448);origins.add(`${f.atlas}/${f.x}/${f.y}`);}
assert.equal(origins.size,217,'No source frame is lost or mapped to the same tile');
let totalBytes=0;
for(const atlas of map.atlases){
 const path=`public${atlas.src}`;assert.ok(existsSync(path));const meta=await sharp(path).metadata();assert.ok(meta.hasAlpha);assert.equal(meta.width,1792);assert.equal(meta.height,896);assert.ok(meta.width<=2048&&meta.height<=2048);totalBytes+=atlas.bytes;
 const {data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let local=0;local<atlas.frameCount;local++){
  const frame=map.frames[atlas.firstFrame+local];let count=0,minX=448,maxX=0,minY=448,maxY=0;
  for(let y=0;y<448;y++)for(let x=0;x<448;x++){
   const alpha=data[((frame.y+y)*info.width+frame.x+x)*4+3];
   if(x<12||y<12||x>=436||y>=436)assert.equal(alpha,0,`Tile padding must be transparent: ${frame.sourceFrame}`);
   if(alpha>128){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  }
  assert.ok(count>60000&&count<140000,`Real head area: ${frame.sourceFrame}`);
  assert.ok(maxY-minY>=378&&maxY-minY<=390,`Stable scale: ${frame.sourceFrame}`);
  assert.ok(Math.abs((maxX+minX)/2-224)<12,`Centered head: ${frame.sourceFrame}`);
  assert.ok(Math.abs((maxY+minY)/2-224)<4,`Stable vertical center: ${frame.sourceFrame}`);
 }
}
assert.ok(totalBytes<12*1024*1024);
for(const [x,y,expected] of [[0,0,'center'],[-.8,0,'left'],[.8,0,'right'],[0,-.8,'top'],[0,.8,'bottom'],[-.8,-.8,'topLeft'],[.8,-.8,'topRight'],[-.8,.8,'bottomLeft'],[.8,.8,'bottomRight']])assert.equal(gazeDirection(x,y),expected);
assert.equal(gazeDirection(.24,0),'center');assert.equal(gazeDirection(.24,0,'right'),'right');assert.equal(gazeDirection(.15,0,'right'),'center');
assert.equal(gazeDirection(-.8,-.24,'topLeft'),'topLeft');assert.equal(gazeDirection(-.8,-.15,'topLeft'),'left');
assert.equal(actualDirection(map,'right'),'center');assert.equal(actualDirection(map,'left'),'left');
for(const [width,height,headWidth,headHeight] of [[1160,590,265,318],[375,500,174,209]]){
 const head={left:(width-headWidth)/2,top:50,width:headWidth,height:headHeight},region={width,height};
 const p=normalizeGaze(head.left+head.width*.12,head.top+head.height/2,head,region);
 assert.equal(gazeDirection(p.x,p.y),'left','Moving toward the left side of the visible head must trigger an actual left pose');
 const center=normalizeGaze(width/2,head.top+head.height/2,head,region);assert.equal(gazeDirection(center.x,center.y),'center');
}
const settle=(t,n=240)=>{for(let i=0;i<n;i++)t.step(1/60)};
const t=new CharacterTimeline(map,()=>.5);t.setDirection('left');settle(t,180);assert.equal(t.pose,'left');assert.equal(t.frame,map.states.left.holdFrame);
t.setDirection('center');settle(t,180);assert.equal(t.pose,'center');assert.equal(t.goal,'center');
// Reversing the same real continuous clip must preserve its current pose.
const rapid=new CharacterTimeline(map);rapid.setDirection('left');settle(rapid,25);const before=rapid.sample();rapid.setDirection('center');rapid.step(1/60);assert.ok(Math.abs(rapid.sample().a-before.a)<=2);rapid.setDirection('left');rapid.step(1/60);assert.ok(Math.abs(rapid.sample().a-before.a)<=3);settle(rapid,180);assert.equal(rapid.pose,'left');
rapid.setDirection('right');settle(rapid,180);assert.equal(rapid.pose,'center');assert.equal(rapid.requested,'right');
for(let k=0;k<500;k++){rapid.setDirection(DIRECTIONS[k%9]);rapid.step(1/60);const s=rapid.sample();assert.ok(s.a>=0&&s.b<217);assert.ok(Math.abs(s.a-s.b)<=1,'Only neighboring real frames interpolate; unrelated clips use a named short fade');}
const eggs=new CharacterTimeline(map,()=>0);assert.ok(eggs.trigger(0));assert.equal(eggs.trigger(200),false);const first=eggs.lastExpression;settle(eggs,220);assert.equal(eggs.pose,'center');assert.ok(eggs.trigger(3000));assert.notEqual(eggs.lastExpression,first);eggs.setDirection('left');settle(eggs,300);assert.equal(eggs.pose,'left','After an expression, the most recent gaze target resumes');
eggs.setSpeed(100);assert.equal(eggs.speed,2);eggs.setSpeed(0);assert.equal(eggs.speed,.25);
let images=[],ready=0;const factory=()=>{const im={src:'',onload:null,onerror:null};images.push(im);return im;};
const cache=new FrameAtlas(map,()=>ready++,()=>{},factory);cache.protect([21]);for(let i=0;i<20;i++)cache.get(21);assert.equal(images.length,1,'Pending identical atlas loads are deduplicated');images[0].onload();assert.ok(cache.get(21));assert.equal(ready,1);
for(let id=4;id<10;id++){cache.load(id);images.at(-1).onload();assert.ok(cache.cache.size<=3);assert.ok(cache.cache.has(map.frames[21].atlas),'Current texture cannot be evicted');}
cache.load(15);images.at(-1).onerror();const loads=images.length;cache.load(15);assert.equal(images.length,loads,'Failed sheets must not be requested every animation frame');cache.destroy();assert.equal(cache.cache.size,0);assert.equal(cache.pending.size,0);
// Exercise the real rAF renderer with canvas/image test doubles. No browser
// performance, touch behavior or GPU claims are inferred from these tests.
let jobs=new Map(),nextId=0,paints=[],loaded=0;images=[];
const context=()=>({setTransform(...v){assert.deepEqual(v,[1,0,0,1,0,0])},clearRect(){},drawImage(...v){paints.push(v)},globalAlpha:1,globalCompositeOperation:'source-over'});
const canvas={clientWidth:265,clientHeight:318,width:0,height:0,getContext:context,ownerDocument:{createElement(){return {width:0,height:0,getContext:context}}}};
const player=new ChenleSpriteAnimator(canvas,map,{requestFrame:fn=>{const id=++nextId;jobs.set(id,fn);return id;},cancelFrame:id=>jobs.delete(id),imageFactory:factory,onReady:()=>loaded++});
function flush(time){const work=[...jobs.values()];jobs.clear();for(const fn of work)fn(time);for(const im of images)if(im.onload&&im.src&&!im.done){im.done=true;im.onload();}}
for(let i=0;i<10;i++)flush(i*17);assert.equal(loaded,1);assert.ok(paints.length>0);assert.equal(canvas.width,265);assert.equal(canvas.height,318);
player.setDirection('left');for(let i=10;i<130;i++)flush(i*17);assert.equal(player.timeline.pose,'left');
player.setVisible(false);assert.equal(jobs.size,0);const old=paints.length;flush(999999);assert.equal(paints.length,old);
player.setVisible(true);flush(1000000);assert.ok(jobs.size>0);player.setPlaying(false);flush(1000017);assert.equal(jobs.size,0,'Manual pause stops the rAF loop');
player.setReducedMotion(true);player.setDirection('left');flush(1000034);assert.equal(player.timeline.frame,45);assert.equal(jobs.size,0,'Reduced motion uses a genuine static pose without an animation loop');player.setDirection('top');flush(1000051);assert.equal(player.timeline.frame,21);
player.destroy();assert.equal(jobs.size,0);assert.equal(canvas.width,0);assert.equal(player.atlas.cache.size,0);
console.log('PASS: all 217 alpha frames in 28 bounded atlases; honest 9-direction availability; stable placement; dead zone/hysteresis; continuous/reversible real-frame paths; expression cooldown/resume; bounded/deduplicated textures; rAF pause/visibility/reduced-motion/cleanup.');
