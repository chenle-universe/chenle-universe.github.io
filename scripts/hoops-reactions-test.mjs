import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {allReactionScenes,createReactionPicker,reactionPools} from '../lib/hoops-reactions.ts';
assert.equal(allReactionScenes.length,13);assert.equal(new Set(allReactionScenes).size,13);
for(const mood of ['encourage','cheer','comfort']){
 const picker=createReactionPicker(()=>.37),pool=reactionPools[mood],batch=pool.map(()=>picker.pick(mood));
 assert.deepEqual(new Set(batch),new Set(pool),'One full same-mood cycle visits all eligible scenes');
 let previous=batch.at(-1);for(let i=0;i<100;i++){const scene=picker.pick(mood);assert.ok(pool.includes(scene));assert.notEqual(scene,previous);previous=scene}
}
const picker=createReactionPicker(()=>.51);let previous='encourage';for(let i=0;i<300;i++){const mood=['encourage','cheer','comfort'][i%3],scene=picker.pick(mood);assert.ok(reactionPools[mood].includes(scene));assert.notEqual(scene,previous,'Changing mood cannot immediately repeat a shared scene');previous=scene}
for(const name of allReactionScenes){const path=`public/assets/hoops/curry-${name}.gif`;assert.equal(readFileSync(path).subarray(0,3).toString(),'GIF');const hashes=execFileSync('magick',[path,'-coalesce','-format','%#\n','info:'],{encoding:'utf8'}).trim().split('\n');assert.ok(hashes.length>=2);assert.ok(new Set(hashes).size>=2,'Every GIF contains actual distinct animation frames');}
console.log('PASS: thirteen real animated GIFs; all situation-specific pools; full shuffle-bag coverage; no consecutive duplicates over 600 draws or across mood changes.');
