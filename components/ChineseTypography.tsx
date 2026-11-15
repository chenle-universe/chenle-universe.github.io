'use client';
import {useEffect} from 'react';

// Apply reading adjustments only to actual Chinese copy, preserving English labels and artwork.
export default function ChineseTypography({lang}:{lang:string}){
 useEffect(()=>{
  if(lang!=='zh')return;
  let frame=0,active=true;
  const marked=new Set<HTMLElement>();
  const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   if(!active)return;
   document.querySelectorAll<HTMLElement>('.site-shell *,.page-transition *').forEach(el=>{
    if(marked.has(el)||el.closest('script,style,svg,canvas,[aria-hidden="true"],.crossword-cell,.puzzle-cell,.orbit-navigation'))return;
    const text=Array.from(el.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('');
    if(!/[\u3400-\u9fff]/.test(text))return;
    const computed=getComputedStyle(el),size=parseFloat(computed.fontSize),line=parseFloat(computed.lineHeight)/size;
    if(!Number.isFinite(size)||!size)return;
    const isControl=!!el.closest('button,label,nav,small,[role="button"]');
    const nextSize=size>=28?size:Math.min(28,Math.max(isControl?17:20,size*1.13));
    el.style.setProperty('--zh-copy-size',`${nextSize.toFixed(2)}px`);
    el.style.setProperty('--zh-copy-leading',String(Number.isFinite(line)?Math.max(isControl?1.25:1.45,Math.min(line,isControl?1.4:1.55)):1.5));
    el.dataset.zhCopy='true';marked.add(el);
   });
   window.dispatchEvent(new Event('chenle-typography-updated'));
  })};
  const observer=new MutationObserver(update);observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  update();document.fonts.ready.then(()=>{if(active)update()});
  return()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();for(const el of marked){delete el.dataset.zhCopy;el.style.removeProperty('--zh-copy-size');el.style.removeProperty('--zh-copy-leading')}};
 },[lang]);
 return null;
}
