import assert from 'node:assert/strict';
import sharp from 'sharp';
import {camFrames,frameOrder,frameForMode,camStickers,fingerStickerSize} from '../data/camStudio.ts';
import {paintBase,paintFrame,MagicField,coverRect,projectHands,mirrorPoint} from '../lib/cam/visuals.ts';

assert.equal(frameOrder.length,7);
assert.equal(new Set(frameOrder).size,7);
assert.ok(!frameOrder.includes('magic')&&!frameOrder.includes('sound'));
for (const frame of frameOrder) {
  assert.equal(frameForMode('photo',frame),frame);
  assert.equal(frameForMode('magic',frame),'magic');
  assert.equal(frameForMode('sound',frame),'sound');
}
for (const [id,src] of Object.entries(camFrames)) {
  const image=sharp(`public${src}`),meta=await image.metadata();
  assert.ok(meta.hasAlpha,`${id} frame needs a transparent photo window`);
  const alpha=await image.extract({left:Math.floor(meta.width*.3),top:Math.floor(meta.height*.3),width:Math.floor(meta.width*.4),height:Math.floor(meta.height*.4)}).extractChannel('alpha').raw().toBuffer();
  assert.ok(alpha.reduce((sum,v)=>sum+v,0)/alpha.length<1,`${id} must not cover the face area`);
}
assert.equal(camStickers.length,10);
assert.ok(!camStickers.some(s=>/dream|lightstick|seven/i.test(s.id)),'Hand stickers must use birthday rather than group symbols');
assert.ok(!Object.values(camFrames).some(src=>/frame-dream|frame-magic\.webp/.test(src)),'Team-themed frames must not be used');
assert.ok(!camStickers.some(s=>s.id==='cherry'||s.id==='star'));
assert.ok(camStickers.some(s=>s.id==='birthday-gift')&&camStickers.some(s=>s.id==='birthday-cake'));
for(const sticker of camStickers)assert.ok((await sharp(`public${sticker.src}`).metadata()).hasAlpha);

function context(width=960,height=720) {
  const calls=[];
  const ctx=new Proxy({canvas:{width,height},calls,drawImage:(...args)=>calls.push(args),createLinearGradient:()=>({addColorStop(){}})}, {
    get:(target,key)=>key in target?target[key]:()=>{},
  });
  return ctx;
}
const art=Object.fromEntries(Object.keys(camFrames).map(id=>[id,{id,complete:true,naturalWidth:1448}]));
for(const [sourceWidth,sourceHeight] of [[1280,720],[720,1280],[1000,1000],[4000,800],[800,4000]])
for(const mode of ['photo','magic','sound'])for(const frame of frameOrder) {
  const height=mode==='photo'&&frame==='card'?1280:720;
  const source={videoWidth:sourceWidth,videoHeight:sourceHeight};
  const preview=context(960,height),exported=context(1920,height*2);
  const options={mode,frame,source,mirror:true,beauty:false,stickers:[]};
  const rect=paintBase(preview,options),large=paintBase(exported,options);
  for(const key of ['x','y','w','h'])assert.equal(large[key],rect[key]*2,'PNG uses the same cover geometry');
  assert.ok(Math.abs(rect.w/rect.h-sourceWidth/sourceHeight)<1e-10,'Filling the frame must not stretch the image');
  assert.ok(rect.x<=1e-8&&rect.y<=1e-8&&rect.x+rect.w>=960-1e-8&&rect.y+rect.h>=height-1e-8,'Image must fill the entire canvas behind every frame opening');
  assert.equal(preview.calls.length,1,'Base does not draw a premature frame beneath effects');
  paintFrame(preview,mode,frame,art);
  paintFrame(exported,mode,frame,art);
  assert.equal(preview.calls.at(-1)[0].id,frameForMode(mode,frame));
  assert.equal(exported.calls.at(-1)[0].id,frameForMode(mode,frame));
  assert.deepEqual(preview.calls.at(-1).slice(1),[0,0,960,height]);
  assert.deepEqual(exported.calls.at(-1).slice(1),[0,0,1920,height*2]);
}
const viewport={x:0,y:0,w:960,h:720},crop=coverRect(1280,720,viewport);
assert.deepEqual(crop,{x:-160,y:0,w:1280,h:720});
const original={id:'Left',seen:100,points:Array.from({length:21},()=>({x:1-.75,y:.5}))};
const projected=projectHands([original],crop,viewport)[0];
assert.deepEqual(mirrorPoint(projected.points[8],viewport),{x:160,y:360},'Finger stickers align with the same mirrored cover crop');
assert.equal(original.points[8].x,.25,'Projection must not mutate tracker history');
const bigViewport={x:0,y:0,w:1920,h:1440};
assert.deepEqual(projectHands([original],coverRect(1280,720,bigViewport),bigViewport)[0].points,projected.points,'Exported hand coordinates match preview');
for(let zone=0;zone<8;zone++) {
  const x=(zone+.5)/8,rawX=(x*viewport.w-crop.x)/crop.w;
  const hand={...original,points:original.points.map(p=>({...p,x:rawX}))};
  const point=projectHands([hand],crop,viewport)[0].points[8];
  assert.equal(Math.floor(point.x*8),zone,'All eight visible music zones remain accessible after cropping');
}
const hands=['Left','Right'].map(id=>({id,seen:100,points:Array.from({length:21},()=>({x:.5,y:.5}))}));
const stickers=camStickers.map(s=>({...s,complete:true,naturalWidth:320}));
for(const width of [960,1920]) {
  const ctx=context(width,width*.75);
  new MagicField().draw(ctx,{x:0,y:0,w:width,h:width*.75},0,stickers,hands,true,100);
  assert.equal(ctx.calls.length,10,'All ten fingertips retain their own sticker');
  assert.ok(ctx.calls.every(call=>call[3]===fingerStickerSize*width/960&&call[4]===fingerStickerSize*width/960));
  assert.ok(fingerStickerSize>36,'Hand stickers are larger than the original size');
  assert.equal(ctx.calls[7][0].id,'birthday-gift');
  assert.equal(ctx.calls[8][0].id,'birthday-cake');
}
console.log('PASS: 7 photo frames, 2 independent fixed frames, transparent face windows, gap-free cover for portrait/landscape/square photos, matched preview/PNG/hand geometry, and larger birthday fingertip stickers.');
