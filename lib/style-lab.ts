import {defaultLook,styleCategories,styleItems,type StyleLook,type StyleItem} from '../data/styleLab';
export function resetLook():StyleLook{return {...defaultLook,accessories:[]}}
export function accessorySlot(id:string){return styleItems.find(i=>i.id===id)?.slot??id}
export function normalizedAccessories(ids:readonly string[]){const slots=new Map<string,string>();for(const id of ids)if(styleItems.some(i=>i.id===id&&i.category==='accessories'))slots.set(accessorySlot(id),id);return [...slots.values()]}
export function equipItem(look:StyleLook,item:StyleItem):StyleLook{
 if(item.category!=='accessories')return {...look,[item.category]:item.id,accessories:item.category==='hair'&&item.id==='hair-rollers'?look.accessories.filter(id=>accessorySlot(id)!=='headwear'):look.accessories};
 const remaining=look.accessories.filter(id=>id!==item.id&&accessorySlot(id)!==accessorySlot(item.id));
 return {...look,hair:look.hair==='hair-rollers'&&accessorySlot(item.id)==='headwear'?'hair-blond':look.hair,accessories:look.accessories.includes(item.id)?remaining:[...remaining,item.id]};
}
export function randomLook(random=Math.random):StyleLook{
 const look=resetLook();for(const category of styleCategories){const options=styleItems.filter(i=>i.category===category);if(category!=='accessories')look[category]=options[Math.min(options.length-1,Math.floor(random()*options.length))].id;}
 const slots=new Map<string,StyleItem[]>();for(const item of styleItems.filter(i=>i.category==='accessories'))slots.set(accessorySlot(item.id),[...(slots.get(accessorySlot(item.id))??[]),item]);
 look.accessories=[];for(const options of slots.values())if(!(look.hair==='hair-rollers'&&accessorySlot(options[0].id)==='headwear')&&random()<.4)look.accessories.push(options[Math.min(options.length-1,Math.floor(random()*options.length))].id);return look;
}
export type StyleLayer={id:string;image:string;layerOrder:number;clip?:number[][]};
export function layerClipStyle(layer:StyleLayer){return layer.clip?{clipPath:`polygon(${layer.clip.map(([x,y])=>`${x/1024*100}% ${y/1536*100}%`).join(',')})`}:undefined}
export function lookLayers(look:StyleLook):StyleLayer[]{
 const accessories=normalizedAccessories(look.accessories).filter(id=>look.hair!=='hair-rollers'||accessorySlot(id)!=='headwear'),hidesHairCrown=accessories.some(id=>styleItems.find(i=>i.id===id)?.hidesHairCrown);
 const ids=new Set([look.hair,look.tops,look.bottoms,look.shoes,look.background,...accessories]);
 const repairedNeck=['hoodie','knit','tee'].includes(look.tops)||!!styleItems.find(i=>i.id===look.tops)?.neckline;
 const legs=look.bottoms==='shorts'?'bare':'covered';
 const layers=styleItems.filter(i=>ids.has(i.id)&&i.id!=='headphones').map(item=>item.category==='hair'&&hidesHairCrown?{...item,image:`/assets/style-lab/rig/${item.id}-under-cap.webp`}:item.category==='tops'&&repairedNeck?{...item,image:`/assets/style-lab/rig/${item.id}-front-v4.webp`}:{...item});
 const result:StyleLayer[]=[...layers,{id:'chenle-base',image:`/assets/style-lab/rig/body-${look.tops}-${legs}-v5.webp`,layerOrder:10}];
 if(repairedNeck)result.push({id:'collar-back',image:`/assets/style-lab/rig/${look.tops}-collar-back-v4.webp`,layerOrder:8},{id:'neck-skin',image:'/assets/style-lab/rig/neck-skin-v5.webp',layerOrder:11});
 if(accessories.includes('headphones'))result.push({id:'headphones-back',image:'/assets/style-lab/rig/headphones-back.webp',layerOrder:55},{id:'headphones-front',image:'/assets/style-lab/rig/headphones-front.webp',layerOrder:75});
 if(accessories.includes('basketball'))result.push({id:'hand-ball',image:'/assets/style-lab/rig/hand-ball.webp',layerOrder:90});
 // Necklace rear arc belongs behind the neck; the hanging chains stay over fabric.
 for(const layer of result){
  const item=styleItems.find(i=>i.id===layer.id);
  if(item?.slot==='neckwear'){
   result.push({id:layer.id+'-back',image:layer.image,layerOrder:9,clip:[[0,0],[1024,0],[1024,327],[0,327]]});
   layer.clip=[[0,327],[1024,327],[1024,1536],[0,1536]];
  }
  // Shoe uppers cover the trouser/ankle seam, including tall boot shafts.
  if(item?.category==='shoes')layer.layerOrder=35;
  if(item?.category==='hair'&&hidesHairCrown)layer.clip=[[403,159],[621,159],[616,196],[606,223],[590,240],[434,240],[418,223],[408,196]];
 }
 return result.sort((a,b)=>a.layerOrder-b.layerOrder);
}
export const styleReviews=['100% CHENLE ENERGY','CURRY WOULD APPROVE','READY FOR THE STAGE',"DAEGAL'S FAVORITE LOOK",'WHO PICKED THIS OUTFIT???'] as const;
export function checkStyle(look:StyleLook,random=Math.random){
 const tags=styleItems.filter(i=>[look.tops,look.bottoms,look.shoes,...look.accessories].includes(i.id)).flatMap(i=>i.tags);
 const suggested=tags.filter(t=>t==='sport').length>=2?1:tags.filter(t=>t==='stage').length>=2?2:0;
 const index=random()<.65?suggested:Math.min(4,Math.floor(random()*5));return {text:styleReviews[index],stars:3+Math.min(2,Math.floor(random()*3))};
}
