'use client';
import {useEffect,useRef,useState} from 'react';
import {birthdayLetter} from '../data/birthdayLetter';
import StyleLabEntry from './StyleLabEntry';
import DreamCake from './DreamCake';
import {birthdayMessages,type Lang} from '../data/content';
import {translations} from '../data/translations';
export default function BirthdayFinale({lang,onReplay,onOpenStyle}:{lang:Lang;onReplay:()=>void;onOpenStyle?:()=>void}){
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),t=translations[lang];
 useEffect(()=>{if(!open)return;const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.showModal();return()=>{document.body.style.overflow=oldOverflow;dialog.current?.close()}},[open]);
 function close(){setOpen(false);trigger.current?.focus()}
 return <section className="finale-page page-enter"><div className="finale-decor" aria-hidden="true"><img className="finale-pearl-star pearl-star-left" src="/assets/cam/star.webp" alt=""/><img className="finale-pearl-star pearl-star-right" src="/assets/cam/star.webp" alt=""/><span className="finale-date-seal">11<br/><i>✧</i><br/>22</span><svg className="finale-ribbons" viewBox="0 0 800 700" fill="none" preserveAspectRatio="none"><path d="M-20 170C110 30 100 290 4 210S140 180 220 260M820 310C660 140 760 470 815 375S690 350 620 430" stroke="#eff7ff" strokeWidth="6"/><path d="M-20 174C110 34 100 294 4 214S140 184 220 264M820 314C660 144 760 474 815 379S690 354 620 434" stroke="#9eaed5" strokeWidth="1.5" strokeDasharray="2 7"/></svg><span className="finale-spark spark-one">✧</span><span className="finale-spark spark-two">✦</span><span className="finale-spark spark-three">✧</span></div><span className="eyebrow">FIVE LITTLE STARS. ONE BIG WISH.</span><div className="finale-stars">✧ ✦ ✧ ✦ ✧</div><h1>Five stars.<br/><em>One shared wish.</em></h1><p>{birthdayMessages.wish[lang]}</p><div className="finale-cake"><DreamCake lit={false} cut={false}/></div><button ref={trigger} className="primary" aria-haspopup="dialog" onClick={()=>setOpen(true)}>{t.letter} ♡</button>
 <dialog ref={dialog} className="birthday-letter-modal" aria-labelledby="birthday-letter-title" onCancel={e=>{e.preventDefault();close()}} onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget){const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)close()}}}>
  <div className="birthday-letter-toolbar"><span>A LETTER, WITH LOVE</span><button type="button" autoFocus onClick={close} aria-label={lang==='zh'?'关闭生日信':'편지 닫기'}>×</button></div>
  {open&&<article className="birthday-letter"><h2 id="birthday-letter-title" className="birthday-letter-salutation">{birthdayLetter.salutation}</h2><div className="birthday-letter-body" lang={lang==='zh'?'zh-CN':'ko'}>{birthdayMessages.letter[lang].split('\n\n').map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div><p className="birthday-letter-signature">{birthdayLetter.closing}</p><p className="birthday-letter-postscript">{birthdayLetter.postscript[lang]}</p></article>}
 </dialog>
 {onOpenStyle&&<StyleLabEntry lang={lang} onOpen={onOpenStyle} finale/>}<button className="text-btn replay-finale" onClick={onReplay}>{t.replay} ↻</button></section>;
}
