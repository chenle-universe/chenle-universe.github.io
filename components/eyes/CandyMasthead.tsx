import {useId} from 'react';
export default function CandyMasthead({volume}:{volume:string}){
 const id=useId();
 return <header className="eyes-reader-masthead eyes-candy-masthead">
  <div className="eyes-candy-imprint"><span>CHENLE UNIVERSE / FAN ZINE</span><span>VOL. {volume} · 1122</span></div>
  <svg className="eyes-candy-ornaments" viewBox="0 0 720 380" aria-hidden="true" focusable="false">
   <defs><pattern id={`${id}-dots`} width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.3" fill="#303336"/></pattern></defs>
   <g transform="translate(5 30) rotate(-18 45 45) scale(.72)" fill="#e8b4ce" stroke="#fff9" strokeWidth="2"><path d="M5 66C14 26 39 11 57 25L70 11L68 32C76 35 86 31 92 36L77 44C69 56 58 50 55 43C42 38 30 45 24 58L32 73L19 68C13 81 4 85 1 81L8 71Z"/><circle cx="70" cy="37" r="2" fill="#63758a" stroke="none"/></g>
   <g transform="translate(625 242) rotate(12 35 35)" fill="#efb2cf" stroke="#73849a" strokeWidth="1.5"><path d="M27 4V55H20V12L67 1V46H60V9Z"/><ellipse cx="13" cy="57" rx="13" ry="9" transform="rotate(-20 13 57)"/><ellipse cx="53" cy="48" rx="13" ry="9" transform="rotate(-20 53 48)"/></g>
   <g fill={`url(#${id}-dots)`}><path d="m622 35 9 25 27 1-22 16 8 26-22-16-23 16 8-26-22-16 28-1z"/><path d="m50 285 8 24 25 1-20 15 7 24-20-15-21 15 8-24-21-15 26-1z"/></g>
   <g fill="none" stroke="#68758a" strokeWidth="1.8" strokeLinecap="round"><path d="M475 103c39-1 80-33 99-65-1 22-15 44-45 56 19-2 32-11 41-24-7 24-29 41-56 43 20 2 32-5 42-13-9 20-28 29-55 28"/><path d="M99 253c-14 18-31 30-52 34m67-22c-12 20-28 36-48 44"/></g>
   <g fill="#e98ebe"><path d="m101 76 4 13 13 4-13 4-4 13-4-13-13-4 13-4z"/><path d="m597 182 4 13 13 4-13 4-4 13-4-13-13-4 13-4z"/></g>
  </svg>
  <h1 className="eyes-candy-title" aria-label="Through my eyes"><span className="eyes-candy-through">Through</span><span className="eyes-candy-eyes"><i>my</i> Eyes</span></h1>
  <div className="eyes-candy-colophon"><span>✳ A LITTLE PAPER UNIVERSE ✳</span></div>
 </header>;
}
