// Seeded placement search: connected words, empty borders and end caps.
export function generateCrossword(answers){
 let seed=1122; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 let best;
 for(let attempt=0;attempt<450;attempt++){
 const grid=new Map(), placed=[];const key=(r,c)=>`${r},${c}`;
 const put=(word,id,r,c,d)=>{placed.push({word,id,r,c,d});[...word].forEach((v,i)=>grid.set(key(r+(d?i:0),c+(d?0:i)),v))};
 const order=answers.map((w,id)=>({w,id})).sort((a,b)=>b.w.length-a.w.length+(rand()-.5)*6);
 put(order[0].w,order[0].id,0,0,0);
 for(const {w,id} of order.slice(1)){
 let choices=[];
 for(const p of placed) for(let j=0;j<p.word.length;j++)for(let i=0;i<w.length;i++)if(p.word[j]===w[i]){
 const d=1-p.d,r=p.r+(p.d?j:0)-(d?i:0),c=p.c+(p.d?0:j)-(d?0:i);
 if(grid.has(key(r-(d?1:0),c-(d?0:1)))||grid.has(key(r+(d?w.length:0),c+(d?0:w.length))))continue;
 let ok=true,cross=0;
 for(let n=0;n<w.length;n++) {const rr=r+(d?n:0),cc=c+(d?0:n),v=grid.get(key(rr,cc));if(v){if(v!==w[n]||placed.some(q=>q.d===d&&rr>=q.r&&cc>=q.c&&rr<=q.r+(q.d?q.word.length-1:0)&&cc<=q.c+(q.d?0:q.word.length-1)))ok=false;cross++}else if(grid.has(key(rr+(d?0:1),cc+(d?1:0)))||grid.has(key(rr-(d?0:1),cc-(d?1:0))))ok=false;}
 if(ok&&cross){const coords=[...grid.keys()].map(x=>x.split(',').map(Number));const rows=[...coords.map(x=>x[0]),r,r+(d?w.length-1:0)],cols=[...coords.map(x=>x[1]),c,c+(d?0:w.length-1)];choices.push({r,c,d,score:(Math.max(...rows)-Math.min(...rows)+1)*(Math.max(...cols)-Math.min(...cols)+1)-cross*4+rand()*6});}
 }
 choices.sort((a,b)=>a.score-b.score);if(choices.length){const q=choices[0];put(w,id,q.r,q.c,q.d)}
 }
 if(placed.length===answers.length){const rs=[...grid.keys()].map(k=>+k.split(',')[0]),cs=[...grid.keys()].map(k=>+k.split(',')[1]);const minR=Math.min(...rs),minC=Math.min(...cs),height=Math.max(...rs)-minR+1,width=Math.max(...cs)-minC+1;const score=width*height+Math.abs(width-height)*4;if(!best||score<best.score){const ps=placed.map(p=>({...p,r:p.r-minR,c:p.c-minC})).sort((a,b)=>a.r-b.r||a.c-b.c);let num=0,last='';for(const p of ps){const k=key(p.r,p.c);if(k!==last)num++;p.number=num;last=k}best={placements:ps,height,width,score};}}
 }
 if(!best)throw Error('No valid connected crossword');return best;
}
export function validateCrossword(layout,answers){const cells=new Map();for(const p of layout.placements){if(p.word!==answers[p.id])throw Error('spelling');[...p.word].forEach((ch,i)=>{const k=`${p.r+(p.d?i:0)},${p.c+(p.d?0:i)}`;if(cells.has(k)&&cells.get(k)!==ch)throw Error('crossing');cells.set(k,ch)})}if(new Set(layout.placements.map(p=>p.id)).size!==answers.length)throw Error('missing');for(const [k,ch] of cells){const [r,c]=k.split(',').map(Number);for(const d of [0,1])if(cells.has(`${r+(d?1:0)},${c+(d?0:1)}`)&&!layout.placements.some(p=>p.d===d&&r>=p.r&&c>=p.c&&r+(d?1:0)<=p.r+(d?p.word.length-1:0)&&c+(d?0:1)<=p.c+(d?0:p.word.length-1)))throw Error('illegal adjacency')}return true}
