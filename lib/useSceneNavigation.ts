'use client';
import {useCallback,useEffect,useRef,useState} from 'react';import {transitionScenes,TRANSITION_DURATION} from '../data/transitions';
export type TransitionState={scene:number;leaving:boolean;token:number};
export function useSceneNavigation(){const [page,setPage]=useState('opening'),[transition,setTransition]=useState<TransitionState|null>(null),[reduced,setReduced]=useState(false);const current=useRef('opening'),sequence=useRef(0),timers=useRef<ReturnType<typeof setTimeout>[]>([]),pending=useRef<{id:string;writeHash:boolean}|null>(null);const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[]};
useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);for(const scene of transitionScenes){const image=new Image();image.src=`/assets/transitions/${scene.id}.gif`}return()=>{clear();media.removeEventListener('change',update)}},[]);
const initial=useCallback((id:string)=>{current.current=id;setPage(id)},[]);
const commit=useCallback(()=>{const to=pending.current;if(!to)return;pending.current=null;current.current=to.id;setPage(to.id);if(to.writeHash)history.pushState(null,'',`#${to.id}`);window.scrollTo({top:0,behavior:'instant'})},[]);
const finish=useCallback(()=>{clear();commit();setTransition(null)},[commit]);
const navigate=useCallback((id:string,writeHash=true)=>{if(id===current.current&&!pending.current)return;clear();pending.current={id,writeHash};const token=sequence.current++;setTransition({scene:token%transitionScenes.length,leaving:false,token});timers.current.push(setTimeout(()=>{commit();setTransition(s=>s?{...s,leaving:true}:null);timers.current.push(setTimeout(()=>setTransition(null),reduced?30:180))},reduced?100:TRANSITION_DURATION))},[commit,reduced]);
return {page,initial,transition,reduced,navigate,finish}}
