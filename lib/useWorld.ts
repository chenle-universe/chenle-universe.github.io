'use client';
import {useEffect,useState} from 'react';
import {migrateCrosswordProgress,CROSSWORD_VERSION} from './crossword-progress.mjs';
import type {Lang} from '../data/content';
export function useWorld(){const [lang,setLang]=useState<Lang>('zh'),[stars,setStars]=useState<string[]>([]),[ready,setReady]=useState(false),[visited,setVisited]=useState(false);
useEffect(()=>{try{const s=migrateCrosswordProgress(localStorage);setLang(s.lang==='ko'?'ko':'zh');setStars(Array.isArray(s.stars)?s.stars:[]);setVisited(!!s.visited)}catch{}setReady(true)},[]);
useEffect(()=>{if(ready)try{localStorage.setItem('chenleland-fans-world-v1',JSON.stringify({lang,stars,visited,crosswordVersion:CROSSWORD_VERSION}))}catch{}},[lang,stars,visited,ready]);
return {lang,setLang,stars,ready,visited,setVisited,earn:(id:string)=>setStars(s=>s.includes(id)?s:[...s,id])}}
