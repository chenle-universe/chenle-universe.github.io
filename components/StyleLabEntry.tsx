import type {Lang} from '../data/content';
export default function StyleLabEntry({lang,onOpen,finale=false}:{lang:Lang;onOpen:()=>void;finale?:boolean}){
 return <button type="button" className={`style-lab-map-link style-lab-entry dreamy-gift-entry${finale?' style-finale-entry':''}`} onClick={onOpen}>
  <span className="gift-entry-kicker">{lang==='zh'?'五颗星之后，送给你的小礼物':'다섯 별을 모은 당신에게, 작은 선물'}</span>
  <img className="gift-entry-emblem" src="/assets/style-lab/style-lab-gift-emblem.webp" alt="CHENLE STYLE LAB" width={512} height={512}/>
  <span className="gift-entry-caption">Dress Up Chenle!</span>
  <span className="gift-entry-open">{lang==='zh'?'打开礼物':'선물 열기'} <i aria-hidden="true">✧</i></span>
 </button>;
}
