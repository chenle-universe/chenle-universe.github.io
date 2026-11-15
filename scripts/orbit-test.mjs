import assert from 'node:assert/strict';import {wrapIndex,orbitPosition,dragToTurn,orbitEmphasis} from '../lib/orbit.ts';
assert.equal(wrapIndex(-1,6),5);assert.equal(wrapIndex(6,6),0);assert.equal(dragToTurn(-150,150),1);assert.equal(dragToTurn(150,150),-1);
for(let turn=0;turn<6;turn+=.25){const positions=Array.from({length:6},(_,i)=>orbitPosition(i,turn));assert.equal(new Set(positions.map(p=>`${p.x.toFixed(4)},${p.y.toFixed(4)}`)).size,6);assert.ok(positions.some(p=>p.y<0)&&positions.some(p=>p.y>0),'Emblems surround the portrait in front and behind');for(let i=0;i<6;i++){const a=positions[i],b=orbitPosition(i,turn+6);assert.ok(Math.abs(a.x-b.x)<1e-10&&Math.abs(a.y-b.y)<1e-10)}}
for(let i=0;i<6;i++){const front=orbitPosition(i,i);assert.equal(front.x,0);assert.equal(front.y,1);assert.equal(front.depth,1)}
assert.ok(orbitEmphasis(1).scale/orbitEmphasis(0).scale>2.5);
console.log('PASS: all six surrounding positions, cyclic continuity, swipe direction and front/back depth.');
