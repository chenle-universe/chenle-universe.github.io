// Assemble reference-inspired pixel art onto the existing rig. Supply source atlas paths through JSON.
import sharp from 'sharp';import{readFileSync,writeFileSync}from'node:fs';
const src=JSON.parse(readFileSync(process.argv[2],'utf8')),root='public/assets/style-lab';let items=JSON.parse(readFileSync('data/styleLab.items.json','utf8'));
async function tight(file,box){const input=box?await sharp(file).extract(box).png().toBuffer():readFileSync(file);const{data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});let l=info.width,t=info.height,r=0,b=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>100){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}return sharp(input).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toBuffer();}
async function add(item,sprite,rect,extraParts=[]){const [x,y,w,h]=rect,image=`/assets/style-lab/${item.category}/${item.id}.webp`,thumbnail=`/assets/style-lab/thumbnails/${item.id}.webp`,part=await sharp(sprite).resize(w,h,{fit:'fill'}).png().toBuffer();await sharp({create:{width:1024,height:1536,channels:4,background:'#0000'}}).composite([{input:part,left:x,top:y},...extraParts]).webp({quality:96,alphaQuality:100}).toFile('public'+image);await sharp(sprite).resize(240,240,{fit:'contain',background:'#0000'}).webp({quality:94,alphaQuality:100}).toFile('public'+thumbnail);items=items.filter(i=>i.id!==item.id);items.push({...item,image,thumbnail,placeholder:true});}
const tops=[
 ['pajama-shirt','西瓜睡衣上衣','수박 잠옷 셔츠',['soft','pajama'],[319,291,386,439],710,'crew'],
 ['graffiti-tee','涂鸦叠穿T恤','그래피티 레이어드 티',['street'],[310,291,404,465],475,'crew'],
 ['denim-jacket','明线牛仔外套','스티치 데님 재킷',['casual','street'],[311,291,402,439],710,'crew'],
 ['sailor-shirt','白色海军领上衣','화이트 세일러 셔츠',['stage'],[319,291,386,439],710,'sailor'],
 ['retro-vest','红蓝篮球背心','레드 네이비 농구 조끼',['sport'],[328,291,368,420],460,'crew'],
];
const meta=await sharp(src.tops).metadata();for(let i=0;i<tops.length;i++){const[id,displayName,displayNameKo,tags,rect,armY,neckline]=tops[i],left=Math.round(i*meta.width/5),right=Math.round((i+1)*meta.width/5),sprite=await tight(src.tops,{left,top:0,width:right-left,height:meta.height});await add({id,category:'tops',displayName,displayNameKo,layerOrder:40,tags,armY,neckline},sprite,rect);}
await add({id:'pajama-pants',category:'bottoms',displayName:'西瓜睡衣长裤',displayNameKo:'수박 잠옷 바지',layerOrder:30,tags:['soft','pajama']},await tight(src.pants),[380,672,268,762]);
const am=await sharp(src.accessories).metadata(),scale=am.width/2172,cut=(left,width)=>({left:Math.round(left*scale),top:0,width:Math.min(am.width-Math.round(left*scale),Math.round(width*scale)),height:am.height});
for(const[id,displayName,displayNameKo,left,width,rect,slot,hidesHairCrown]of [
 ['sleep-mask','薄荷睡眠眼罩','민트 수면 안대',15,420,[408,45,208,84],'headwear',false],
 ['black-cap','做旧黑色棒球帽','워싱 블랙 캡',448,410,[390,5,244,155],'headwear',true],
 ['rollers-band','发卷运动发带','헤어롤 헤어밴드',1260,505,[390,5,244,130],'headwear',false],
 ['gold-chains','层叠金色项链','레이어드 골드 목걸이',1765,407,[455,305,114,115],'neckwear',false],
])await add({id,category:'accessories',displayName,displayNameKo,layerOrder:id==='gold-chains'?70:80,tags:['reference'],slot,hidesHairCrown},await tight(src.accessories,cut(left,width)),rect);
const gl=await tight(src.accessories,cut(890,180)),gr=await tight(src.accessories,cut(1070,190)),right=await sharp(gr).resize(70,239).png().toBuffer();await add({id:'black-gloves',category:'accessories',displayName:'黑色露指长手套',displayNameKo:'블랙 핑거리스 워머',layerOrder:95,tags:['street'],slot:'hands'},gl,[328,610,70,239],[{input:right,left:632,top:610}]);
for(const item of items){if(['cap','headphones'].includes(item.id))item.slot='headwear';if(item.id==='cap')item.hidesHairCrown=true;if(item.id==='necklace')item.slot='neckwear';if(item.id==='sunglasses')item.slot='eyewear';if(item.id==='basketball')item.slot='hand-prop';}
writeFileSync('data/styleLab.items.json',JSON.stringify(items,null,2)+'\n');console.log('Added five reference tops, matching pajama pants and five accessories.');
