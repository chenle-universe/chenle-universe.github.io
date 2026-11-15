import type {PlacedNoteSticker} from '../data/chenleMessages';
export const bound=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function transformNoteSticker(sticker:PlacedNoteSticker,change:Partial<Pick<PlacedNoteSticker,'x'|'y'|'size'|'rotation'>>):PlacedNoteSticker {
 const s={...sticker,...change};return {...s,x:bound(s.x,0,100),y:bound(s.y,0,100),size:bound(s.size,10,45),rotation:bound(s.rotation,-180,180)};
}

export function dragNoteSticker(s:PlacedNoteSticker,dx:number,dy:number,width:number,height:number){return width>0&&height>0?transformNoteSticker(s,{x:s.x+dx/width*100,y:s.y+dy/height*100}):s}
export function pinchNoteSticker(s:PlacedNoteSticker,startDistance:number,distance:number,angle:number){return startDistance>0?transformNoteSticker(s,{size:s.size*distance/startDistance,rotation:s.rotation+angle*180/Math.PI}):s}
