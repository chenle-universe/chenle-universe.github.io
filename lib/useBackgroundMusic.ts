'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

const preferenceKey='chenle-bgm-enabled';
export function useBackgroundMusic(){
 const player=useRef<HTMLAudioElement|null>(null),enabled=useRef(false),request=useRef(0),autoPending=useRef(true);
 const [sound,setSoundState]=useState(false);
 const setSound=useCallback((next:boolean)=>{
  const audio=player.current;if(!audio)return;
  autoPending.current=false;const current=++request.current;enabled.current=next;setSoundState(next);
  try{localStorage.setItem(preferenceKey,String(next))}catch{}
  if(!next){audio.pause();return}
  audio.play().catch(()=>{if(current===request.current){enabled.current=false;setSoundState(false)}});
 },[]);
 useEffect(()=>{
  const audio=new Audio('/audio/next-favorite-day.mp3');audio.loop=true;audio.volume=.28;audio.preload='none';player.current=audio;
  autoPending.current=true;try{autoPending.current=localStorage.getItem(preferenceKey)!=='false'}catch{}
  const firstGesture=(event:Event)=>{
   if(event instanceof KeyboardEvent&&!['Enter',' '].includes(event.key))return;
   if((event.target as Element)?.closest?.('.sound-toggle'))return;
   if(!autoPending.current)return;
   setSound(true);
  };
  const visibility=()=>{if(document.hidden){audio.pause()}else if(enabled.current){audio.play().catch(()=>{enabled.current=false;setSoundState(false)})}};
  const mediaError=()=>{enabled.current=false;setSoundState(false)};
  document.addEventListener('click',firstGesture);document.addEventListener('keydown',firstGesture);document.addEventListener('visibilitychange',visibility);audio.addEventListener('error',mediaError);
  return()=>{request.current++;enabled.current=false;audio.pause();audio.removeAttribute('src');audio.load();player.current=null;document.removeEventListener('click',firstGesture);document.removeEventListener('keydown',firstGesture);document.removeEventListener('visibilitychange',visibility);audio.removeEventListener('error',mediaError)};
 },[setSound]);
 return {sound,setSound};
}
