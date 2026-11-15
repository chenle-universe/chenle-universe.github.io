export function wrapIndex(index:number,count:number){return ((index%count)+count)%count}
export function clampMenu(index:number,count=6){return Math.max(0,Math.min(count-1,index))}
export function orbitPosition(index:number,turn:number,count=6){const angle=(index-turn)*Math.PI*2/count,z=Math.cos(angle),perspective=1/(1.2-.3*z);return {x:Math.sin(angle)*perspective,y:z,depth:(z+1)/2}}

export function dragToTurn(deltaX:number,pixelsPerItem:number){return -deltaX/pixelsPerItem}

export function orbitEmphasis(depth:number){const d=Math.max(0,Math.min(1,depth));return {scale:.46+.76*Math.pow(d,1.65),opacity:.46+.54*d,blur:(1-d)*.7}}
