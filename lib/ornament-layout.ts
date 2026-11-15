export type OrnamentRect={x:number;y:number;width:number;height:number};
export type OrnamentPlacement=OrnamentRect&{rotation:number};
export function scatterOrnaments(width:number,height:number,blocked:OrnamentRect[],seed:number):OrnamentPlacement[]{
 let state=Math.floor(seed*2147483646)+1;
 const random=()=>((state=state*16807%2147483647)-1)/2147483646;
 const placed:OrnamentPlacement[]=[];
 const intersects=(a:OrnamentRect,b:OrnamentRect,pad:number)=>a.x<b.x+b.width+pad&&a.x+a.width+pad>b.x&&a.y<b.y+b.height+pad&&a.y+a.height+pad>b.y;
 for(let i=0;i<8;i++){
  const size=(width<650?35:46)+random()*(i===0?25:12);
  for(let attempt=0;attempt<1200;attempt++){
   const candidate={x:12+random()*Math.max(0,width-size-24),y:8+random()*Math.max(0,height-size-16),width:size,height:size,rotation:random()*32-16};
   if(candidate.x+size>width-8||candidate.y+size>height-8)continue;
   if(blocked.some(r=>intersects(candidate,r,26))||placed.some(r=>intersects(candidate,r,26)))continue;
   placed.push(candidate);break;
  }
 }
 return placed;
}
