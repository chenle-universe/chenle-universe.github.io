/** Real-video frame controller. No CSS transforms, generated faces or eye warps. */
export const DIRECTIONS = ['center','top','bottom','left','right','topLeft','topRight','bottomLeft','bottomRight'];
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
export function normalizeGaze(clientX,clientY,head,region) {
  return {x:clamp((clientX-head.left-head.width/2)/Math.max(head.width*.6,region.width*.25),-1,1),y:clamp((clientY-head.top-head.height/2)/Math.max(head.height*.65,region.height*.3),-1,1)};
}
export function gazeDirection(x,y,previous='center') {
  // Screen coordinates: negative y is up. Separate enter/exit thresholds prevent
  // rapid alternation both at the center and at cardinal/diagonal boundaries.
  const prevX = /left/i.test(previous) ? -1 : /right/i.test(previous) ? 1 : 0;
  const prevY = /top/i.test(previous) ? -1 : /bottom/i.test(previous) ? 1 : 0;
  const axis = (n,p) => n > (p===1?.16:.28) ? 1 : n < -(p===-1?.16:.28) ? -1 : 0;
  const h=axis(clamp(x,-1,1),prevX),v=axis(clamp(y,-1,1),prevY);
  if(!h&&!v)return 'center';
  return (v<0?'top':v>0?'bottom':'')+(h?(v?(h<0?'Left':'Right'):(h<0?'left':'right')):'');
}
export function actualDirection(map,direction) {return map.states[direction]?.available ? direction : 'center';}

export class CharacterTimeline {
  constructor(map,random=Math.random) {
    this.map=map;this.random=random;this.goal='center';this.requested='center';this.pose='center';this.frame=map.defaultFrame;
    this.motion=null;this.expression=null;this.pending=null;this.cooldownUntil=-Infinity;this.lastExpression='';this.idleCursor=0;this.idleSign=-1;this.blinkIn=4.5;this.speed=1;
    this.fadeFrom=null;this.fadeRemaining=0;
  }
  setDirection(direction) {this.requested=DIRECTIONS.includes(direction)?direction:'center';this.goal=actualDirection(this.map,this.requested);}
  setSpeed(speed) {this.speed=clamp(speed,.25,2);}
  trigger(now) {
    if(now<this.cooldownUntil)return false;
    const options=['expressionSmile','expressionBlink','expressionSurprised'].filter(k=>this.map.states[k]?.available&&k!==this.lastExpression);
    if(!options.length)return false;
    this.pending=options[Math.floor(this.random()*options.length)];this.lastExpression=this.pending;this.cooldownUntil=now+2800;return true;
  }
  fadeTo(frame) {if(Math.abs(frame-this.frame)>1){this.fadeFrom=this.frame;this.fadeRemaining=.12;}this.frame=frame;}
  beginMotion(from,to) {
    const def=this.map.transitions[`${from}To${to[0].toUpperCase()+to.slice(1)}`];
    if(!def?.frames?.length){this.fadeTo(this.map.states[to].holdFrame??this.map.states[to].frames[0]);this.pose=to;return;}
    this.fadeTo(def.frames[0]);this.motion={...def,frames:def.frames,position:0,velocity:0};
  }
  beginExpression(name) {
    const def=this.map.states[name];if(!def?.available)return;
    this.fadeTo(def.frames[0]);this.expression={name,frames:def.frames,fps:def.fps||24,position:0};this.pending=null;
  }
  resetStatic(direction=this.requested) {
    this.setDirection(direction);this.motion=null;this.expression=null;this.pending=null;this.fadeRemaining=0;this.fadeFrom=null;
    this.pose=this.goal;this.frame=this.map.states[this.goal].holdFrame??this.map.states[this.goal].frames[0];
  }
  step(delta) {
    const dt=clamp(delta,0,.08)*this.speed;this.fadeRemaining=Math.max(0,this.fadeRemaining-dt);
    if(!this.fadeRemaining)this.fadeFrom=null;
    if(this.expression){
      const e=this.expression;e.position=Math.min(e.frames.length-1,e.position+dt*e.fps);this.frame=e.frames[Math.floor(e.position)];
      if(e.position>=e.frames.length-1){this.expression=null;this.pose='center';this.fadeTo(this.map.defaultFrame);this.idleCursor=0;this.blinkIn=4+this.random()*3;}
      return;
    }
    const target=this.pending?'center':this.goal;
    if(this.motion){
      const m=this.motion,end=target===m.from?0:m.frames.length-1,dist=end-m.position;
      const desired=Math.sign(dist)*Math.min(m.fps,Math.abs(dist)*12+2);
      m.velocity+=(desired-m.velocity)*(1-Math.exp(-dt*18));
      const next=clamp(m.position+m.velocity*dt,0,m.frames.length-1);
      m.position=next;this.frame=m.frames[Math.floor(next)];
      if(Math.abs(end-next)<.025){this.pose=end===0?m.from:m.to;this.motion=null;this.fadeTo(this.pose==='center'?this.map.defaultFrame:(this.map.states[this.pose].holdFrame??m.frames[end]));}
      return;
    }
    if(this.pose!==target){this.beginMotion(this.pose,this.pose!=='center'&&target!=='center'?'center':target);return;}
    if(this.pending){this.beginExpression(this.pending);return;}
    if(this.pose==='center'){
      this.blinkIn-=dt;
      if(this.blinkIn<=0&&this.map.states.expressionBlink.available){this.beginExpression('expressionBlink');return;}
      const idle=this.map.states.idle,frames=idle.frames;
      this.idleCursor+=dt*(idle.fps||12)*this.idleSign;
      if(this.idleCursor<=0){this.idleCursor=0;this.idleSign=1;}
      if(this.idleCursor>=frames.length-1){this.idleCursor=frames.length-1;this.idleSign=-1;}
      // Start/end at the default front frame; this is a contiguous ping-pong clip.
      this.frame=frames[frames.length-1-Math.floor(this.idleCursor)];
    }
  }
  sample() {
    const seq=this.motion||this.expression;
    if(seq){const p=seq.position,a=seq.frames[Math.floor(p)],b=seq.frames[Math.min(seq.frames.length-1,Math.ceil(p))];return {a,b,mix:p-Math.floor(p),fadeFrom:this.fadeFrom,fade:this.fadeRemaining/.12};}
    return {a:this.frame,b:this.frame,mix:0,fadeFrom:this.fadeFrom,fade:this.fadeRemaining/.12};
  }
  upcoming() {
    const seq=this.motion||this.expression;
    if(!seq)return [this.frame];
    const i=Math.floor(seq.position),toward=this.motion&&this.motion.velocity<0?-1:1;
    return [seq.frames[i],seq.frames[clamp(i+toward*4,0,seq.frames.length-1)]];
  }
}

/** At most 3 decoded 1792x896 textures (~18.4 MiB). Pending loads are deduplicated. */
export class FrameAtlas {
  constructor(map,onReady=()=>{},onError=()=>{},imageFactory=()=>new Image()) {this.map=map;this.onReady=onReady;this.onError=onError;this.imageFactory=imageFactory;this.cache=new Map();this.pending=new Map();this.failed=new Set();this.protected=new Set();this.disposed=false;}
  protect(frameIds) {this.protected=new Set(frameIds.filter(id=>id!=null).map(id=>this.map.frames[id].atlas));}
  get(index) {
    const record=this.map.frames[index];if(!record)return null;
    const image=this.cache.get(record.atlas);
    if(image){this.cache.delete(record.atlas);this.cache.set(record.atlas,image);return {image,record};}
    this.load(record.atlas);return null;
  }
  load(id) {
    if(this.disposed||this.cache.has(id)||this.pending.has(id)||this.failed.has(id))return;
    const image=this.imageFactory();this.pending.set(id,image);image.decoding='async';
    image.onload=()=>{if(this.disposed){image.src='';return;}this.pending.delete(id);this.cache.set(id,image);this.evict();this.onReady();};
    image.onerror=()=>{this.pending.delete(id);this.failed.add(id);if(!this.disposed)this.onError(id);};
    image.src=this.map.atlases[id].src;
  }
  evict() {
    for(const [id,image] of this.cache){if(this.cache.size<=3)break;if(this.protected.has(id))continue;this.cache.delete(id);image.src='';}
  }
  destroy() {this.disposed=true;for(const image of [...this.cache.values(),...this.pending.values()]){image.onload=null;image.onerror=null;image.src='';}this.cache.clear();this.pending.clear();}
}

export class ChenleSpriteAnimator {
  constructor(canvas,map,options={}) {
    this.canvas=canvas;this.map=map;this.ctx=canvas.getContext('2d',{alpha:true});if(!this.ctx)throw Error('Canvas 2D unavailable');
    this.timeline=new CharacterTimeline(map,options.random||Math.random);this.playing=options.playing!==false;this.reduced=!!options.reducedMotion;this.visible=true;this.disposed=false;this.raf=0;this.last=0;this.ready=false;this.lastDrawn='';
    this.onReady=options.onReady||(()=>{});this.onError=options.onError||(()=>{});
    this.request=options.requestFrame||globalThis.requestAnimationFrame.bind(globalThis);this.cancel=options.cancelFrame||globalThis.cancelAnimationFrame.bind(globalThis);
    this.atlas=new FrameAtlas(map,()=>this.wake(),id=>this.onError(id),options.imageFactory);
    this.tick=this.tick.bind(this);this.wake();
  }
  wake() {if(!this.disposed&&this.visible&&!this.raf)this.raf=this.request(this.tick);}
  setDirection(direction) {this.timeline.setDirection(direction);if(!this.playing&&this.reduced)this.timeline.resetStatic(direction);this.wake();}
  setPlaying(value) {this.playing=value;this.last=0;this.wake();}
  setReducedMotion(value) {this.reduced=value;this.setPlaying(!value);if(value)this.timeline.resetStatic();}
  setVisible(value) {this.visible=value;this.last=0;if(!value){this.cancel(this.raf);this.raf=0;}else this.wake();}
  setSpeed(value) {this.timeline.setSpeed(value);}
  react(now=performance.now()) {if(!this.playing)return false;const accepted=this.timeline.trigger(now);if(accepted)this.wake();return accepted;}
  resize() {this.lastDrawn='';this.wake();}
  tick(now) {
    this.raf=0;if(this.disposed||!this.visible)return;
    const dt=this.last?Math.min(.08,(now-this.last)/1000):0;this.last=now;
    const before=this.timeline.sample();
    this.atlas.protect([before.a,before.b,before.fadeFrom]);
    // Freeze the clock while a needed atlas decodes; keep the previous drawing.
    if(this.atlas.get(before.a)&&this.atlas.get(before.b)&&this.playing)this.timeline.step(dt);
    const s=this.timeline.sample();this.atlas.protect([s.a,s.b,s.fadeFrom]);
    const a=this.atlas.get(s.a),b=this.atlas.get(s.b),from=s.fadeFrom==null?null:this.atlas.get(s.fadeFrom);
    for(const id of this.timeline.upcoming())this.atlas.get(id);
    if(a&&b&&(s.fadeFrom==null||from||!s.fade))this.draw(a,b,s,from);
    if(this.playing)this.wake();else this.last=0;
  }
  draw(a,b,s,from) {
    const el=this.canvas,dpr=Math.min(globalThis.devicePixelRatio||1,2),w=Math.max(1,Math.round(el.clientWidth*dpr)),h=Math.max(1,Math.round(el.clientHeight*dpr));
    const key=[w,h,s.a,s.b,s.fadeFrom,s.mix.toFixed(3),s.fade.toFixed(3)].join(':');if(key===this.lastDrawn)return;this.lastDrawn=key;
    if(el.width!==w||el.height!==h){el.width=w;el.height=h;}
    const ctx=this.ctx;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    const size=Math.min(w,h),x=(w-size)/2,y=(h-size)/2;
    const paint=(f,opacity)=>{if(!f||opacity<=0)return;ctx.globalAlpha=opacity;const r=f.record;ctx.drawImage(f.image,r.x,r.y,r.width,r.height,x,y,size,size);};
    // Correct premultiplied crossfade on a temporary layer, without reducing
    // alpha through sequential source-over draws of semitransparent cutouts.
    if(!this.layer){this.layer=el.ownerDocument.createElement('canvas');this.layerCtx=this.layer.getContext('2d',{alpha:true});}
    const layer=this.layer,lc=this.layerCtx;
    if(layer.width!==w||layer.height!==h){layer.width=w;layer.height=h;}
    lc.clearRect(0,0,w,h);lc.globalCompositeOperation='source-over';lc.globalAlpha=1;
    const r=a.record;lc.drawImage(a.image,r.x,r.y,r.width,r.height,x,y,size,size);
    if(s.a!==s.b&&s.mix>0){lc.globalCompositeOperation='copy';lc.globalAlpha=1-s.mix;lc.drawImage(a.image,r.x,r.y,r.width,r.height,x,y,size,size);lc.globalCompositeOperation='lighter';lc.globalAlpha=s.mix;const q=b.record;lc.drawImage(b.image,q.x,q.y,q.width,q.height,x,y,size,size);}
    lc.globalCompositeOperation='source-over';lc.globalAlpha=1;
    if(from&&s.fade>0)paint(from,s.fade);
    ctx.globalAlpha=from?1-s.fade:1;
    if(from&&s.fade>0)ctx.globalCompositeOperation='lighter';ctx.drawImage(layer,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    if(!this.ready){this.ready=true;this.onReady();}
  }
  destroy() {this.disposed=true;this.cancel(this.raf);this.raf=0;this.atlas.destroy();if(this.layer){this.layer.width=0;this.layer.height=0;}this.canvas.width=0;this.canvas.height=0;}
}
