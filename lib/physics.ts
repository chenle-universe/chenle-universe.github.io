export type BallState={x:number;y:number;vx:number;vy:number;flying:boolean;scored:boolean;gold:boolean;rotation:number};
// All coordinates are in a fixed 400 × 500 court; the SVG scales only the display.
export function advanceBall(b:BallState,hoop:number,dt:number){
 const oldY=b.y;b.vy+=580*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rotation+=b.vx*dt*.6;
 if(b.x<15||b.x>385){b.vx*=-.64;b.x=Math.max(15,Math.min(385,b.x))}
 if(b.y>94&&b.y<155&&Math.abs(b.x-(hoop+48))<14&&b.vx>0){b.vx*=-.65;b.x=hoop+33}
 // In this projected court, the rising ball is behind the rim; collide on its descending approach.
 if(b.vy>0)for(const rx of [hoop-31,hoop+31]){const dx=b.x-rx,dy=b.y-163,dist=Math.hypot(dx,dy);if(dist<15&&dist>0){const nx=dx/dist,ny=dy/dist,dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.6*dot*nx;b.vy-=1.6*dot*ny;b.x=rx+nx*15;b.y=163+ny*15}}}
 if(!b.scored&&b.vy>0&&oldY<163&&b.y>=163&&Math.abs(b.x-hoop)<24){b.scored=true;return b.gold?5:2}
 return 0;
}
