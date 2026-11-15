'use client';
import noteTranslations from '../data/noteTranslations.json';
import {siteFetch} from '../lib/site-network';
import {useEffect,useRef,useState} from 'react';
import type {Lang} from '../data/content';
const copy={zh:{translate:'翻译',loading:'正在翻译…',error:'翻译服务暂时不可用，请稍后重试。原文仍保留。',hint:'自动识别原文语言 · 机器翻译仅供参考',result:'译文',original:'查看原文'},ko:{translate:'번역하기',loading:'번역 중…',error:'번역 서비스를 잠시 이용할 수 없어요. 원문은 그대로예요.',hint:'원문 언어 자동 감지 · 기계 번역은 참고용이에요',result:'번역문',original:'원문 보기'}};
export default function NoteTranslation({message,lang}:{message:string;lang:Lang}){
 const [target,setTarget]=useState(lang==='zh'?'zh-CN':'ko'),[translated,setTranslated]=useState(''),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false);
 const cache=useRef(new Map<string,string>()),controller=useRef<AbortController|null>(null),t=copy[lang];
 function cancelTranslation(){const previous=controller.current;controller.current=null;previous?.abort()}
 useEffect(()=>{setTarget(lang==='zh'?'zh-CN':'ko')},[lang]);
 useEffect(()=>{cancelTranslation();setTranslated('');setFailed(false);setLoading(false);return cancelTranslation},[message,target]);
 async function translate(){
  cancelTranslation();const current=new AbortController();controller.current=current;const isCurrent=()=>controller.current===current;
  const key=JSON.stringify([message,target]),saved=cache.current.get(key)||noteTranslations.find(note=>note.source===message.trim())?.translations[target];setFailed(false);if(saved){setTranslated(saved);setLoading(false);return}
  setLoading(true);setTranslated('');const timeout=setTimeout(()=>current.abort(),12000);
  try{const r=await siteFetch('/api/notes/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,target}),signal:current.signal});if(!r.ok)throw Error();const data=await r.json();if(typeof data.translation!=='string'||!data.translation.trim())throw Error();if(isCurrent()&&!current.signal.aborted){cache.current.set(key,data.translation);setTranslated(data.translation)}}catch{if(isCurrent())setFailed(true)}finally{clearTimeout(timeout);if(isCurrent())setLoading(false)}
 }
 return <><p className="words-full-message" lang={translated?target:undefined} aria-live="polite">{translated||message}</p><div className="notes-translation"><label>{t.result}<select value={target} onChange={e=>setTarget(e.target.value)}><option value="zh-CN">中文</option><option value="ko">한국어</option><option value="en">English</option></select></label><button type="button" onClick={translate} disabled={loading}>{loading?t.loading:t.translate}</button><button type="button" onClick={()=>{cancelTranslation();setTranslated('');setLoading(false);setFailed(false)}} disabled={!translated}>{t.original}</button><small>{t.hint}</small><div aria-live="polite" aria-busy={loading}>{failed&&<p role="alert">{t.error}</p>}</div></div></>;
}
