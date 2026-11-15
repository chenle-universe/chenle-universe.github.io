// Build anatomical occlusion layers, keeping all artwork in the same 1024×1536 rig.
import sharp from 'sharp';
import {readFileSync,mkdirSync} from 'node:fs';
const root='public/assets/style-lab',items=JSON.parse(readFileSync('data/styleLab.items.json'));
mkdirSync(root+'/rig',{recursive:true});
async function masked(source,rects,target){
 const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536">${rects.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>`).join('')}</svg>`);
 await sharp(source).composite([{input:mask,blend:'dest-in'}]).webp({lossless:true,alphaQuality:100}).toFile(root+'/rig/'+target+'.webp');
}
const body=root+'/base/chenle-face-clean-v5.webp';
for(const hair of items.filter(i=>i.category==='hair'))await masked('public'+hair.image,[[0,150,1024,90]],hair.id+'-under-cap');
const headphones='public'+items.find(i=>i.id==='headphones').image;
await masked(headphones,[[0,0,1024,164]],'headphones-back');
const earcups=[];
for(const [left,target] of [[390,397],[512,585]]){
 const crop=await sharp(headphones).extract({left,top:124,width:122,height:124}).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=122,y0=124,x1=0,y1=0;
 for(let y=0;y<124;y++)for(let x=0;x<122;x++)if(crop.data[(y*122+x)*4+3]>100){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
 const earcup=await sharp(headphones).extract({left:left+x0,top:124+y0,width:x1-x0+1,height:y1-y0+1}).resize(48,88).png().toBuffer();earcups.push({input:earcup,left:target,top:151});
}
await sharp({create:{width:1024,height:1536,channels:4,background:'#0000'}}).composite(earcups).webp({lossless:true}).toFile(root+'/rig/headphones-front.webp');
await masked(body,[[640,777,64,90]],'hand-ball');
console.log('Built six body occlusion states, four cap-compatible hair layers, split headphones and holding hand.');

// Garment-specific v4 neck and cuff registration; legacy masks stay available for rollback.
const necklineShapes={
 hoodie:'<path d="M470 250H554V295L574 282 568 304 538 328 512 340 486 326 456 304 450 282 470 291Z" fill="white"/>',
 knit:'<rect x="470" y="250" width="84" height="60" fill="white"/><ellipse cx="512" cy="310" rx="56" ry="17" fill="white"/>',
 tee:'<rect x="470" y="250" width="84" height="60" fill="white"/><ellipse cx="512" cy="310" rx="56" ry="20" fill="white"/>',
};
for(const item of items.filter(i=>i.category==='tops'&&i.neckline))necklineShapes[item.id]=item.neckline==='sailor'?'<rect x="470" y="250" width="84" height="52" fill="white"/><ellipse cx="512" cy="301" rx="41" ry="8" fill="white"/>':necklineShapes.tee;
for(const top of items.filter(i=>i.category==='tops'))for(const legs of ['covered','bare']){
 const fixed=top.id in necklineShapes,armY=top.armY??({jersey:314,tee:430,hoodie:730,knit:695,'stage-jacket':746})[top.id];
 const rects=[[398,0,228,fixed?275:321],[320,armY,120,870-armY],[590,armY,120,870-armY]];
 if(legs==='bare')rects.push([385,860,260,535]);await masked(body,rects,`body-${top.id}-${legs}-v5`);
}
{
 const mask=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><path d="M470 275H554V305L591 325 597 380H427L433 325 470 305Z" fill="white"/></svg>');
 await sharp(body).resize(1024,1536).composite([{input:mask,blend:'dest-in'}]).webp({lossless:true}).toFile(root+'/rig/neck-skin-v5.webp');
}
for(const [id,shape] of Object.entries(necklineShapes)){
 const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536">${shape}</svg>`),source='public'+items.find(i=>i.id===id).image;
 await sharp(source).composite([{input:mask,blend:'dest-out'}]).webp({lossless:true}).toFile(root+'/rig/'+id+'-front-v4.webp');
 await sharp(source).composite([{input:mask,blend:'dest-in'}]).webp({lossless:true}).toFile(root+'/rig/'+id+'-collar-back-v4.webp');
}
console.log('Built individual neckline/cuff profiles, three front/back collars and the continuous neck patch.');
