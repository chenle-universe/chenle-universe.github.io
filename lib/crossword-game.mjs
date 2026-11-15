export const cellKey=(r,c)=>`${r},${c}`;
export const normalizeAnswer=value=>String(value).toUpperCase().replace(/[^A-Z]/g,'');
export const wordKeys=p=>[...p.word].map((_,i)=>cellKey(p.r+(p.d?i:0),p.c+(p.d?0:i)));
export function createCrosswordModel(layout){
 const cells={};for(const p of layout.placements)for(const [i,ch] of [...p.word].entries()){
  const k=wordKeys(p)[i];if(cells[k]&&cells[k].ch!==ch)throw Error('Invalid crossword crossing');
  if(!cells[k])cells[k]={ch,ids:[]};cells[k].ids.push(p.id);if(i===0)cells[k].number=p.number;
 }
 const ordered=Object.keys(cells).sort((a,b)=>cells[b].ids.length-cells[a].ids.length||a.localeCompare(b));
 const fixed=ordered.slice(0,Math.round(ordered.length*.2));return {cells,fixed};
}
export function correctWordIds(layout,cells,fixed,values){return layout.placements.filter(p=>wordKeys(p).every(k=>(fixed.includes(k)?cells[k].ch:values[k])===cells[k].ch)).map(p=>p.id)}
export function nextHint(keys,cells,fixed,values){return keys.find(k=>!fixed.includes(k)&&values[k]!==cells[k].ch)}
/** @returns {Record<string,string>} */
export function sanitizeCrosswordValues(raw,cells,fixed){const result={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;for(const [key,value] of Object.entries(raw))if(cells[key]&&!fixed.includes(key)&&typeof value==='string'&&/^[A-Z]$/.test(value))result[key]=value;return result;}
export function pasteAnswer(keys,start,text,values,fixed){
 const result={...values},letters=normalizeAnswer(text);const targets=keys.slice(Math.max(0,keys.indexOf(start)));
 // Full-word pastes consume prefilled letters too, preserving alignment.
 if(letters.length===keys.length){keys.forEach((k,i)=>{if(!fixed.includes(k))result[k]=letters[i]});return result}
 let i=0;for(const k of targets){if(fixed.includes(k))continue;if(i>=letters.length)break;result[k]=letters[i++]}return result;
}
