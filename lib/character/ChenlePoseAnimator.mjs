/** Continuous damped gaze field over reference poses; no face deformation. */
export class ChenlePoseAnimator {
 constructor(canvas,map,options={}) {
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});this.map=map;this.playing=options.playing!==false;this.reduced=!!options.reducedMotion;this.visible=true;this.disposed=false;this.ready=false;this.raf=0;this.last=0;this.target=map.center;this.requested='center';this.expression=null;this.cooldown=-Infinity;this.lastEgg=-1;this.mix=1;this.timer=null;
  this.request=options.requestFrame||globalThis.requestAnimationFrame.bind(globalThis);this.cancel=options.cancelFrame||globalThis.cancelAnimationFrame.bind(globalThis);this.schedule=options.setTimeout||globalThis.setTimeout.bind(globalThis);this.clearTimer=options.clearTimeout||globalThis.clearTimeout.bind(globalThis);this.random=options.random||Math.random;this.onReady=options.onReady||(()=>{});
  this.from=canvas.ownerDocument.createElement('canvas');this.fromCtx=this.from.getContext('2d',{alpha:true});this.tick=this.tick.bind(this);
  this.image=options.imageFactory?options.imageFactory():new Image();this.image.decoding='async';this.image.onload=()=>{if(this.disposed)return;this.ready=true;this.resize();this.onReady();this.armBlink();};this.image.onerror=()=>{this.ready=false;options.onError?.();};this.image.src=map.atlas;
 }
 wake(){if(this.ready&&this.visible&&!this.disposed&&!this.raf)this.raf=this.request(this.tick);}
 select(index,instant=false){
  if(index===this.target)return;
  if(this.canvas.width&&this.canvas.height){this.from.width=this.canvas.width;this.from.height=this.canvas.height;this.fromCtx.clearRect(0,0,this.from.width,this.from.height);this.fromCtx.drawImage(this.canvas,0,0);}
  this.field=false;this.target=index;this.mix=1;this.last=0;this.wake();
 }
 setDirection(direction){this.requested=direction;if(this.expression)return;const index=this.map.directions[direction]??this.map.center;if(!this.playing&&!this.reduced)return;this.field=false;this.mix=1;this.target=index;this.wake();}
 react(now=performance.now()){
  if(!this.playing||!this.ready||now<this.cooldown)return false;
  const choices=this.map.expressions.filter((_,i)=>i!==this.lastEgg);const entry=choices[Math.floor(this.random()*choices.length)];if(!entry)return false;
  this.lastEgg=this.map.expressions.indexOf(entry);this.cooldown=now+1600;this.expression={remaining:.85};this.select(entry.frame);this.wake();return true;
 }
 armBlink(){this.clearTimer(this.timer);this.timer=null;if(!this.playing||!this.visible||!this.ready||this.disposed)return;this.timer=this.schedule(()=>{this.timer=null;if(!this.expression){this.expression={remaining:.28};this.select(this.map.expressions[0].frame);this.wake();}},5500+this.random()*2000);}
 setPlaying(value){this.playing=value;this.last=0;this.clearTimer(this.timer);this.timer=null;if(value){this.armBlink();this.wake();}else{this.cancel(this.raf);this.raf=0;}}
 setReducedMotion(value){this.reduced=value;this.setPlaying(!value);if(value){this.expression=null;this.requested='center';this.gaze={x:0,y:0};this.aim={x:0,y:0};this.select(this.map.center,true);this.mix=1;this.field=true;this.wake();}}
 setVisible(value){this.visible=value;this.last=0;this.cancel(this.raf);this.raf=0;this.clearTimer(this.timer);this.timer=null;if(value){this.armBlink();this.wake();}}
 setSpeed(){}
 resize(){if(!this.ready)return;const dpr=Math.min(globalThis.devicePixelRatio||1,2),w=Math.max(1,Math.round(this.canvas.clientWidth*dpr)),h=Math.max(1,Math.round(this.canvas.clientHeight*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.mix=1;}this.wake();}
 tick(now){
  this.raf=0;if(this.disposed||!this.visible||!this.ready)return;
  const dt=this.last?Math.min(.05,(now-this.last)/1000):0;this.last=now;
  if(this.playing){this.mix=Math.min(1,this.mix+dt/.16);if(this.expression){this.expression.remaining-=dt;if(this.expression.remaining<=0){this.expression=null;this.requested='center';this.aim={x:0,y:0};this.gaze={x:0,y:0};this.select(this.map.center);this.armBlink();}}}
  const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,size=Math.min(w,h),r=this.map.frames[this.target];ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(this.image,r.x,r.y,r.width,r.height,(w-size)/2,(h-size)/2,size,size);
  if(this.playing&&this.expression)this.wake();else this.last=0;
 }
 destroy(){this.disposed=true;this.cancel(this.raf);this.raf=0;this.clearTimer(this.timer);this.timer=null;this.image.onload=null;this.image.onerror=null;this.image.src='';this.from.width=0;this.from.height=0;this.canvas.width=0;this.canvas.height=0;}
}
