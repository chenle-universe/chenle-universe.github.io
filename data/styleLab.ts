import rawItems from './styleLab.items.json';
export type StyleCategory='hair'|'tops'|'bottoms'|'shoes'|'accessories'|'background';
export interface StyleItem {id:string;category:StyleCategory;image:string;thumbnail:string;layerOrder:number;tags:string[];displayName:string;displayNameKo:string;placeholder:boolean;armY?:number;neckline?:'crew'|'sailor';slot?:string;hidesHairCrown?:boolean}
export const styleItems=rawItems as StyleItem[];
export const styleCategories:StyleCategory[]=['hair','tops','bottoms','shoes','accessories','background'];
export const styleCanvas={width:1024,height:1536,logicalWidth:160,logicalHeight:240,base:'/assets/style-lab/base/chenle-face-clean-v5.webp'};
export type StyleLook=Record<Exclude<StyleCategory,'accessories'>,string>&{accessories:string[]};
export const defaultLook:StyleLook={hair:'hair-black',tops:'tee',bottoms:'jeans',shoes:'sneakers',background:'court',accessories:[]};
