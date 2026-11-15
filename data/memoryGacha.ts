import assets from './memoryGacha.assets.json';
export type MemoryGachaPhoto={id:string;image:string;title:string;captionZh:string;captionKo:string;width:number;height:number};
const copy=[
 {id:'photo-01',title:'FAN MOMENT 01',captionZh:"把这一刻的星光，装进口袋里。",captionKo:"이 순간의 별빛을 주머니에 담아요."},
 {id:'photo-02',title:'FAN MOMENT 02',captionZh:"无论来自哪里，都能在歌声里相遇。",captionKo:"어디에서 왔든 노래 안에서 만나요."},
 {id:'photo-03',title:'FAN MOMENT 03',captionZh:"每一次认真投入，都在舞台上发光。",captionKo:"진심으로 몰입하는 순간이 무대에서 빛나요."},
 {id:'photo-04',title:'FAN MOMENT 04',captionZh:"愿你的世界，总有放晴的时刻。",captionKo:"네 세상에 맑은 날이 가득하길."},
 {id:'photo-05',title:'FAN MOMENT 05',captionZh:"今天的造型，也值得一颗星星。",captionKo:"오늘의 스타일에도 별 하나!"},
 {id:'photo-06',title:'FAN MOMENT 06',captionZh:"把快乐留在这一张照片里。",captionKo:"이 사진에 행복을 담아 두어요."},
 {id:'photo-07',title:'FAN MOMENT 07',captionZh:"惊喜总在不经意的瞬间出现。",captionKo:"뜻밖의 순간에 찾아오는 작은 선물."},
 {id:'photo-08',title:'FAN MOMENT 08',captionZh:"值得珍藏的，是每一个闪闪发亮的瞬间。",captionKo:"반짝이는 모든 순간을 간직해요."},
 {id:'photo-09',title:'FAN MOMENT 09',captionZh:"不同的视角，同样的应援心意。",captionKo:"시선은 달라도 응원하는 마음은 같아요."},
 {id:'photo-10',title:'FAN MOMENT 10',captionZh:"愿你一直这样，自在又开心地笑。",captionKo:"언제나 자유롭고 행복하게 웃길."}
];
export const memoryGachaPhotos:MemoryGachaPhoto[]=copy.map(item=>{const asset=assets[item.id as keyof typeof assets];if(!asset)throw Error(`Missing memory photo: ${item.id}`);return {...item,image:asset.image,width:asset.width,height:asset.height}});
