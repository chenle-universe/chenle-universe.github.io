import assert from 'node:assert/strict';import {advanceBall} from '../lib/physics.ts';
const ball=(gold=false)=>({x:200,y:414,vx:0,vy:-650,flying:true,scored:false,gold,rotation:0});
for(const [gold,expected] of [[false,2],[true,5]]){const b=ball(gold);let score=0;for(let i=0;i<240;i++)score+=advanceBall(b,200,1/120);assert.equal(score,expected,'A well-aimed descending shot must score exactly once');}
const miss=ball();miss.vy=-280;let score=0;for(let i=0;i<240;i++)score+=advanceBall(miss,200,1/120);assert.equal(score,0,'A weak shot must miss');
const rim={...ball(),x:165,y:145,vx:0,vy:150};for(let i=0;i<10;i++)advanceBall(rim,200,1/120);assert.ok(rim.vy<0,'A shot hitting the rim from above must bounce');
console.log('PASS: normal +2, bonus +5, no duplicate scores, real misses and rim bounce.');
