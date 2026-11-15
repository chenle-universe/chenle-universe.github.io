import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const groups=[{path:process.argv[2],cols:3,names:['chenle-mascot','chef-cat','chenle-wave','daegal','chenle-daegal','friends','basketball','microphone','dolphin']},{path:process.argv[3],cols:4,names:['blue-star','pearl-wing','yellow-star','spiral-flower','clover','fish','heart-key','butterfly','bow-heart','blue-sparkle','moon','blue-bow']}];
await mkdir('public/assets/decor',{recursive:true});
for(const {path,cols,names} of groups){
 const meta=await sharp(path).metadata();
 for(let i=0;i<names.length;i++){
 const left=Math.round(i%cols*meta.width/cols),top=Math.round(Math.floor(i/cols)*meta.height/3);
 const width=Math.round((i%cols+1)*meta.width/cols)-left,height=Math.round((Math.floor(i/cols)+1)*meta.height/3)-top;
 const cell=await sharp(path).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=width,y0=height,x1=0,y1=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(cell.data[(y*width+x)*4+3]>100){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
 await sharp(cell.data,{raw:cell.info}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(304,304,{fit:'inside'}).extend({top:8,bottom:8,left:8,right:8,background:'#00000000'}).webp({quality:94,alphaQuality:100}).toFile(`public/assets/decor/${names[i]}.webp`);
 }
}
console.log('Prepared 21 transparent ornaments.');
