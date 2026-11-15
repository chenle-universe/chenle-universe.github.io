import type {MemoryGachaPhoto} from '../data/memoryGacha';
export function chooseMemoryPhoto(photos:readonly MemoryGachaPhoto[],previousId:string|null,random=Math.random){const eligible=photos.filter(photo=>photos.length===1||photo.id!==previousId);if(!eligible.length)throw Error('No memory photos available');return eligible[Math.min(eligible.length-1,Math.floor(random()*eligible.length))]}
