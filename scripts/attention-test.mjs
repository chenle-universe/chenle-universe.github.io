import assert from 'node:assert/strict';import {attentionFrame,attentionPose,ATTENTION_DURATION} from '../lib/attention-loop.ts';
assert.deepEqual(attentionFrame(0),attentionFrame(ATTENTION_DURATION));assert.deepEqual(attentionFrame(27.9),attentionFrame(0));
for(const [t,x,y] of [[3,-1,0],[6,-.85,.65],[9,-.85,-.65],[13,0,0],[15.5,1,0],[18,.85,.65],[21,.85,-.65],[26,0,0]]){assert.deepEqual(attentionPose(t),{x,y})}
const moving=attentionFrame(2);assert.ok(Math.abs(moving.eyes.x)>Math.abs(moving.head.x),'Eyes lead delayed head motion');
for(let t=0;t<ATTENTION_DURATION;t+=.02){const a=attentionFrame(t),b=attentionFrame(t+.0001);for(const k of ['eyes','head']){assert.ok(Math.abs(a[k].x-b[k].x)<.002);assert.ok(Math.abs(a[k].y-b[k].y)<.002)}}
console.log('PASS: exact neutral loop bookends, ordered attention poses, pauses, eye lead and continuous easing.');
