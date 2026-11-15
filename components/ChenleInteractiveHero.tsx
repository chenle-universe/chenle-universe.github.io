'use client';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import type {Lang} from '../data/content';
import {gazeDirection,normalizeGaze} from '../lib/character/ChenleSpriteAnimator.mjs';

import {ChenlePoseAnimator as ChenleSpriteAnimator} from '../lib/character/ChenlePoseAnimator.mjs';

let manifestRequest:Promise<any>|null=null;
function loadManifest(){
  if(!manifestRequest)manifestRequest=fetch('/characters/chenle/pose-map.json').then(response=>{if(!response.ok)throw Error('Character manifest unavailable');return response.json();}).catch(error=>{manifestRequest=null;throw error;});
  return manifestRequest;
}
export default function ChenleInteractiveHero({lang}:{lang:Lang}){
  const button=useRef<HTMLButtonElement>(null),canvas=useRef<HTMLCanvasElement>(null),animator=useRef<ChenleSpriteAnimator|null>(null);
  const [ready,setReady]=useState(false);
  const requested=useRef('center'),touch=useRef<{id:number;x:number;y:number;moved:boolean}|null>(null),skipClick=useRef(false);
  function point(clientX:number,clientY:number){
    const hero=button.current,scene=hero?.closest<HTMLElement>('.orbit-scene');if(!hero||!scene)return;
    const a=hero.getBoundingClientRect(),b=scene.getBoundingClientRect();
    const {x,y}=normalizeGaze(clientX,clientY,a,b);
    requested.current=gazeDirection(x,y,requested.current);animator.current?.setDirection(requested.current);
  }
  function neutral(){requested.current='center';animator.current?.setDirection('center');}
  useEffect(()=>{
    let disposed=false,cleanup=()=>{};
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    loadManifest().then(map=>{
      if(disposed||!canvas.current||!button.current)return;
      const player=new ChenleSpriteAnimator(canvas.current,map,{playing:!media.matches,reducedMotion:media.matches,onReady:()=>{if(!disposed)setReady(true);}});animator.current=player;
      player.setDirection(requested.current);
      player.setVisible(!document.hidden);
      const scene=button.current.closest<HTMLElement>('.orbit-scene');
      const move=(event:globalThis.PointerEvent)=>{if(event.pointerType==='mouse'||event.pointerType==='pen')point(event.clientX,event.clientY);};
      const leave=()=>neutral();
      const visibility=()=>player.setVisible(!document.hidden);
      const preference=()=>player.setReducedMotion(media.matches);
      const resize=new ResizeObserver(()=>player.resize());resize.observe(canvas.current);
      scene?.addEventListener('pointermove',move,{passive:true});scene?.addEventListener('pointerleave',leave);
      document.addEventListener('visibilitychange',visibility);media.addEventListener('change',preference);
      cleanup=()=>{resize.disconnect();scene?.removeEventListener('pointermove',move);scene?.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',preference);player.destroy();animator.current=null;};
    }).catch(()=>{/* Keep the transparent source-video idle frame as fallback. */});
    return()=>{disposed=true;cleanup();};
  },[]);
  function down(event:PointerEvent<HTMLButtonElement>){
    event.stopPropagation();skipClick.current=false;
    if(event.pointerType==='mouse')return;
    touch.current={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};event.currentTarget.setPointerCapture(event.pointerId);point(event.clientX,event.clientY);
  }
  function move(event:PointerEvent<HTMLButtonElement>){
    const start=touch.current;if(!start||start.id!==event.pointerId)return;
    event.stopPropagation();if(Math.hypot(event.clientX-start.x,event.clientY-start.y)>8)start.moved=true;point(event.clientX,event.clientY);
  }
  function up(event:PointerEvent<HTMLButtonElement>){
    event.stopPropagation();const start=touch.current;if(!start||start.id!==event.pointerId)return;
    skipClick.current=start.moved;touch.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);neutral();
  }
  const label=lang==='zh'?'辰乐互动头像 · 移动鼠标或拖动头像 · 轻点换表情':'천러 인터랙티브 아바타 · 마우스를 움직이거나 얼굴을 드래그 · 눌러서 표정 바꾸기';
  return <>
    <button ref={button} className="portrait-anchor portrait-hit chenle-interactive-hero" aria-label={label} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={event=>{up(event);skipClick.current=true;}} onLostPointerCapture={()=>{if(touch.current){touch.current=null;neutral();}}} onClick={event=>{event.stopPropagation();if(skipClick.current){skipClick.current=false;return;}animator.current?.react();}}>
      <span className="chenle-sprite-surface" data-ready={ready}><img src="/characters/chenle/pose-idle.png" alt="" draggable={false} width={448} height={448}/><canvas ref={canvas} aria-hidden="true"/></span>
    </button>
  </>;
}
