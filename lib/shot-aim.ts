import {advanceBall,type BallState} from './physics.ts';
import {advanceCourt} from './hoops-motion.ts';
export const BALL_ORIGIN={x:100,y:414};
export const makeBall=():BallState=>({...BALL_ORIGIN,vx:0,vy:0,flying:false,scored:false,gold:false,rotation:0});
// Select the descending intersection of the same gravity used by the live simulation.
export function aimedShot(targetX:number,lift=650):BallState{const speed=Math.max(620,Math.min(740,lift)),time=(speed+Math.sqrt(speed*speed-2*580*(414-163)))/580;return {...makeBall(),vx:(Math.max(60,Math.min(340,targetX))-BALL_ORIGIN.x)/time,vy:-speed,flying:true}}
export function previewShot(targetX:number,lift:number,hoop:number,phase?:number){const ball=aimedShot(targetX,lift),points=[{x:ball.x,y:ball.y}],court={ball,hoop,phase:phase??0};let hit=false;for(let i=0;i<300;i++){if(phase===undefined?advanceBall(ball,hoop,1/120):advanceCourt(court,1/120))hit=true;if(i%4===0)points.push({x:ball.x,y:ball.y});if(hit||ball.y>495)break}return {points,hit}}
// Spaced random drops leave time to play each ball; a new schedule is made for every round.
export function goldenSchedule(random= Math.random){const count=random()<.5?2:3,windows=count===2?[[5,10],[18,24]]:[[4,8],[12,17],[21,25]];return windows.map(([start,end])=>start+random()*(end-start))}
