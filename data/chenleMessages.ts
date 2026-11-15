export type NoteLanguage = 'zh' | 'ko' | 'en';
export type NoteStyle = 'sticky' | 'star' | 'polaroid' | 'envelope' | 'receipt' | 'postcard';
export type PlacedNoteSticker={uid:string;id:string;x:number;y:number;size:number;rotation:number};
export type ChenleMessage = {
 id: string; message: string; from: string; location?: string; language: NoteLanguage;
 visibility?:'public'|'private';textColor?: string; stickers?: (string|PlacedNoteSticker)[]; styleVariant: NoteStyle; createdAt?: string; status: 'pending' | 'approved' | 'rejected'; source: 'example' | 'local' | 'remote';
};
// Three initial notes from the site; real public submissions replace these automatically.
export const chenleMessages: ChenleMessage[] = [
 {id:'example-01',message:'生日快乐！愿新的一岁可以尽兴唱歌、开心打球，也能好好吃饭，好好睡觉。',from:'',language:'zh',styleVariant:'sticky'},
 {id:'example-02',message:'천러야, 생일 축하해! 네 노래 덕분에 평범한 하루도 조금 더 반짝여. 늘 건강하고 많이 웃길!',from:'',language:'ko',styleVariant:'polaroid'},
 {id:'example-03',message:'Happy birthday! Great music, good food, no lost AirPods.',from:'',language:'en',styleVariant:'receipt'},
].map(note=>({...note,status:'approved',source:'example'})) as ChenleMessage[];
