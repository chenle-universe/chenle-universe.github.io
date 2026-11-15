"use client";
import type { Lang } from '../../data/content';
import {fortuneDisclaimer,type ChenleFortune} from '../../data/chenleFortunes';
import {Camera,Heart,Headphones,Music2,PawPrint,Star} from 'lucide-react';
const themes=['cookie','pink','blue'] as const;
export default function FortuneGachaResult({fortune,lang,onAgain}:{fortune:ChenleFortune;lang:Lang;capsuleSrc:string;edge:number;onAgain:()=>void}){
 const zh=lang==='zh',variant=(Number(fortune.id.slice(-2))-1)%3,theme=themes[variant],Doodle=fortune.luckyItemZh.includes('头')||fortune.luckyItemZh.includes('狗')?PawPrint:fortune.luckyItemZh.includes('耳')||fortune.luckyItemZh==='AirPods'?Headphones:fortune.luckyItemZh.includes('相')||fortune.luckyItemZh==='拍立得'?Camera:Music2;
 return <article className={`capsule-prize-card fortune-card fortune-stationery fortune-theme-${theme}`} lang={zh?'zh-CN':'ko'} aria-label={zh?'辰乐运势卡':'천러 행운 카드'}>
  <div className="fortune-note-trim" aria-hidden="true"/>
  <header className="fortune-note-heading" aria-label="CHENLE FORTUNE"><span>CHENLE</span><strong>Fortune</strong><Heart className="fortune-heading-heart" size={23} strokeWidth={1.2} aria-hidden="true"/></header>
  <div className="fortune-note-sheet">
   <span className="fortune-note-scribble" aria-hidden="true"><Star size={17} strokeWidth={1.1}/><Heart size={19} strokeWidth={1.1}/><span>✧</span></span>
   <h2>{zh?fortune.titleZh:fortune.titleKo}</h2>
   <p className="fortune-note-message">{zh?fortune.messageZh:fortune.messageKo}</p>
   <div className="fortune-note-bottom"><dl className="fortune-note-luck"><div><dt>Lucky item</dt><dd>{zh?fortune.luckyItemZh:fortune.luckyItemKo}</dd></div><div><dt>Lucky number</dt><dd>{fortune.luckyNumber}</dd></div></dl></div>
   <div className="fortune-note-doodles" aria-hidden="true"><Doodle size={29} strokeWidth={1.1}/><span>♡</span><Star size={20} strokeWidth={1}/></div>
  </div>
  <button type="button" className="memory-one-more fortune-note-again" onClick={onAgain}>ONE MORE? <span aria-hidden="true">↗</span></button>
  <small className="fortune-note-disclaimer">{fortuneDisclaimer[lang]}</small>
  <span className="fortune-note-bow" aria-hidden="true"><svg viewBox="0 0 100 80" fill="none"><path d="M49 30C26-4-9 5 12 25Q27 38 49 30C73-4 109 5 87 25Q71 38 49 30ZM46 33Q43 56 26 73M53 33Q60 57 79 73M43 28Q50 20 56 29L53 37H46Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
 </article>;
}
