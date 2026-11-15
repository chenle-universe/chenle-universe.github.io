import assert from 'node:assert/strict';
import {aimedShot,goldenSchedule,previewShot} from '../lib/shot-aim.ts';
import {advanceBall} from '../lib/physics.ts';
for(const hoop of [145,170,200,230,255])for(const lift of [620,650,740])for(const dt of [1/120,1/60,.025]){const b=aimedShot(hoop,lift);let scored=0;for(let i=0;i<360;i++)scored+=advanceBall(b,hoop,dt);assert.equal(scored,2,`Assisted shot must reach hoop ${hoop}, loft ${lift}`);assert.ok(previewShot(hoop,lift,hoop).hit,'Preview must agree with live scoring')}
const curved=previewShot(200,650,200).points;assert.ok(curved.some(p=>p.y<100)&&curved.at(-1).x-curved[0].x>70,'Default preview must form a visible curved arc, not a vertical line');
assert.equal(previewShot(60,650,255).hit,false,'Misaligned trajectory must show a miss');
for(let n=0;n<100;n++){const drops=goldenSchedule();assert.ok([2,3].includes(drops.length));assert.ok(drops.every((v,i)=>v>0&&v<26&&(i===0||v>drops[i-1]+3)))}
assert.equal(goldenSchedule(()=>0).length,2);assert.equal(goldenSchedule(()=>.99).length,3);
console.log('PASS: curved preview/live shot agreement at all hoop positions and lofts; real misses; 2–3 spaced random golden drops.');
