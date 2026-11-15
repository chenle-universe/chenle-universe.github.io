'use client';
import {useEffect,useRef,useState} from 'react';
import {ornamentAssets,pageOrnamentThemes,type OrnamentId} from '../data/pageOrnaments';
import {scatterOrnaments,type OrnamentPlacement} from '../lib/ornament-layout';
export default function PageOrnaments({page,position}:{page:string;position:'top'|'bottom'}){
 const host=useRef<HTMLDivElement>(null),[placements,setPlacements]=useState<OrnamentPlacement[]>([]);
 useEffect(()=>{
  if(position!=='top'||!host.current)return;
  const root=host.current.closest('main');if(!root)return;
  const seed=Math.random();let frame=0;
  const arrange=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const box=root.getBoundingClientRect(),blocked:{x:number;y:number;width:number;height:number}[]=[];
   const add=(r:DOMRect)=>{if(r.width&&r.height)blocked.push({x:r.left-box.left,y:r.top-box.top,width:r.width,height:r.height})};
   root.querySelectorAll('img,svg,canvas,video,button,a,label,fieldset,input,textarea,select,[role="button"],[contenteditable="true"],.note-studio-paper,.note-writing-paper,.style-stage,.notes-photo-reveal').forEach(el=>{if(!el.closest('.page-ornaments,.dream-scenery,.orbit-background'))add(el.getBoundingClientRect())});
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Node|null;
   while((node=walker.nextNode())){if(!node.textContent?.trim()||node.parentElement?.closest('.page-ornaments,script,style,[aria-hidden="true"]'))continue;const range=document.createRange();range.selectNodeContents(node);for(const rect of Array.from(range.getClientRects()))add(rect)}
   setPlacements(scatterOrnaments(box.width,box.height,blocked,seed));
  })};
  const resize=new ResizeObserver(arrange);resize.observe(root);
  const mutations=new MutationObserver(records=>{if(records.some(r=>!(r.target as Element).closest?.('.page-ornaments')))arrange()});mutations.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','open']});
  const settle=setTimeout(arrange,650);window.addEventListener('scroll',arrange,{passive:true});root.addEventListener('transitionend',arrange);root.addEventListener('animationend',arrange);window.addEventListener('chenle-typography-updated',arrange);window.addEventListener('resize',arrange);root.addEventListener('load',arrange,true);document.fonts.ready.then(arrange);arrange();
  return()=>{clearTimeout(settle);window.removeEventListener('scroll',arrange);root.removeEventListener('transitionend',arrange);root.removeEventListener('animationend',arrange);cancelAnimationFrame(frame);resize.disconnect();mutations.disconnect();window.removeEventListener('chenle-typography-updated',arrange);window.removeEventListener('resize',arrange);root.removeEventListener('load',arrange,true)};
 },[page,position]);
 const theme=pageOrnamentThemes[page]??pageOrnamentThemes.universe;
 const stickers:OrnamentId[]=[theme.character,...theme.charms,theme.companion,'sparkle','bow','star'];
 if(position==='bottom')return <div className="ornament-bottom-space" aria-hidden="true"/>;
 return <div ref={host} className={`page-ornaments ornaments-for-${page}`} aria-hidden="true">{placements.map((p,i)=><img key={i} src={ornamentAssets[stickers[i%stickers.length]]} alt="" draggable={false} decoding="async" width={160} height={160} style={{left:p.x,top:p.y,width:p.width,height:p.height,rotate:`${p.rotation}deg`}}/>)}</div>;
}
