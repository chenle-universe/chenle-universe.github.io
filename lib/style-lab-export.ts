import {lookLayers,type checkStyle} from './style-lab';
import type {StyleLook} from '../data/styleLab';
export type StyleReview=ReturnType<typeof checkStyle>;
function loadStyleImage(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not load style layer'));image.src=src})}
export async function renderStyleCard(look:StyleLook,review:StyleReview):Promise<Blob>{
 const layers=lookLayers(look),images=await Promise.all(layers.map(layer=>loadStyleImage(layer.image))),logo=await loadStyleImage('/brand/chenle-universe-logo.png');
 const canvas=document.createElement('canvas');canvas.width=800;canvas.height=1320;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
 ctx.fillStyle='#dce9fa';ctx.fillRect(0,0,800,1320);ctx.fillStyle='#697493';ctx.fillRect(30,30,740,1260);ctx.fillStyle='#f4f4fc';ctx.fillRect(36,36,728,1248);
 ctx.drawImage(logo,55,44,156,78);ctx.textAlign='right';ctx.fillStyle='#4c557a';ctx.font='bold 24px monospace';ctx.fillText('CHENLE STYLE LAB',746,86);ctx.font='16px monospace';ctx.fillText('Dress Up Chenle!',746,112);
 ctx.imageSmoothingQuality='high';for(let index=0;index<images.length;index++){ctx.imageSmoothingEnabled=layers[index].id==='chenle-base'||layers[index].id==='neck-skin';const clip=layers[index].clip;ctx.save();if(clip){ctx.beginPath();clip.forEach(([x,y],i)=>i?ctx.lineTo(80+x*640/1024,142+y*960/1536):ctx.moveTo(80+x*640/1024,142+y*960/1536));ctx.closePath();ctx.clip()}ctx.drawImage(images[index],80,142,640,960);ctx.restore();}
 ctx.strokeStyle='#737ea5';ctx.lineWidth=4;ctx.strokeRect(78,140,644,964);ctx.textAlign='center';ctx.fillStyle='#525d82';ctx.font='bold 26px monospace';ctx.fillText(review.text,400,1152);ctx.font='24px monospace';ctx.fillText('★'.repeat(review.stars)+'☆'.repeat(5-review.stars),400,1192);
 ctx.font='13px monospace';ctx.fillText('FAN-MADE STYLE CHECK · JUST FOR FUN',400,1230);ctx.font='12px monospace';ctx.fillText('REFERENCE CHARACTER / STYLE LAB v2',400,1254);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG export failed')),'image/png'));
}
