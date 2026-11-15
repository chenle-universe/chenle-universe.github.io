// Asset assembly only: split generated transparent atlases, size and position on the shared canvas.
// Usage: node scripts/prepare-style-avatar.mjs /absolute/path/to/source-manifest.json
import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const manifest=JSON.parse(readFileSync(process.argv[2],'utf8'));
const dir='public/assets/style-lab',W=1024,H=1536,scale=W/160;
const layouts={
 'hair-black':[61,1,38,31],'hair-blond':[61,1,38,31],'hair-red':[61,1,38,31],'hair-silver':[61,1,38,31],
 jersey:[63,48,34,62],'stage-jacket':[50,46,60,69],hoodie:[49,45,62,70],knit:[50,46,60,68],tee:[51,45.5,58,64.5],
 jeans:[61,105,39,119],cargo:[60,105,41,119],shorts:[60,105,41,33],trousers:[61,105,39,119],
 sneakers:[60,214,40,19],boots:[60,209,40,24],loafers:[60,216,40,17],
 headphones:[62,11,36,28],sunglasses:[69,26,23,9],cap:[61,1,38,24],necklace:[70,48,20,13],basketball:[100,110,25,25],
};
async function split(file,count){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let ranges=[];let start=null,last=0;
 for(let x=0;x<info.width;x++){let count=0;for(let y=0;y<info.height;y++)if(data[(y*info.width+x)*4+3]>100)count++;
 if(count>5){if(start===null)start=x;last=x}else if(start!==null&&x-last>12){ranges.push([start,last]);start=null}}
 if(start!==null)ranges.push([start,last]);if(ranges.length===count*2)ranges=Array.from({length:count},(_,i)=>[ranges[i*2][0],ranges[i*2+1][1]]);if(ranges.length!==count)throw Error(`Expected ${count} isolated cells in ${file}, got ${JSON.stringify(ranges)}`);
 const result=[];for(const [left,right] of ranges){let top=info.height,bottom=0;for(let y=0;y<info.height;y++)for(let x=left;x<=right;x++)if(data[(y*info.width+x)*4+3]>100){top=Math.min(top,y);bottom=Math.max(bottom,y)}
 const x=Math.max(0,left-2),y=Math.max(0,top-2);result.push(await sharp(file).extract({left:x,top:y,width:Math.min(info.width-x,right-left+5),height:Math.min(info.height-y,bottom-top+5)}).png().toBuffer());}return result;
}
let items=JSON.parse(readFileSync('data/styleLab.items.json','utf8'));
await sharp(manifest.base).resize(W,H).webp({quality:96,alphaQuality:100}).toFile(dir+'/base/chenle-reference-v2.webp');
const fitted=[];
for(const category of ['hair','tops','bottoms','shoes','accessories']){
 const list=items.filter(i=>i.category===category),sprites=await split(manifest[category],list.length);mkdirSync(dir+'/'+category,{recursive:true});
 for(let i=0;i<list.length;i++){
 const item=list[i],[x,y,w,h]=layouts[item.id],sprite=await sharp(sprites[i]).resize(Math.round(w*scale),Math.round(h*scale),{fit:'fill',kernel:'nearest'}).png().toBuffer();
 const image=`/assets/style-lab/${category}/${item.id}-v2.webp`,thumbnail=`/assets/style-lab/thumbnails/${item.id}-v2.webp`;
 await sharp({create:{width:W,height:H,channels:4,background:'#0000'}}).composite([{input:sprite,left:Math.round(x*scale),top:Math.round(y*scale)}]).webp({quality:96,alphaQuality:100}).toFile('public'+image);
 await sharp(sprites[i]).resize(240,240,{fit:'contain',background:'#0000',kernel:'nearest'}).webp({quality:94,alphaQuality:100}).toFile('public'+thumbnail);
 item.image=image;item.thumbnail=thumbnail;fitted.push({id:item.id,rect:[x,y,w,h]});
 }
}
for(const item of items.filter(i=>i.category==='background')){const image=`/assets/style-lab/background/${item.id}-v2.webp`;await sharp(readFileSync('public'+item.image)).resize(W,H,{kernel:'nearest'}).webp({quality:96}).toFile('public'+image);item.image=image;}
writeFileSync('data/styleLab.items.json',JSON.stringify(items,null,2)+'\n');writeFileSync('data/styleLab.anchors.json',JSON.stringify({width:W,height:H,logicalWidth:160,logicalHeight:240,items:fitted},null,2)+'\n');
console.log('Assembled 21 transparent wardrobe layers, base and five aligned backgrounds.');
