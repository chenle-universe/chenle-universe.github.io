import type {ChenleMessage,NoteLanguage,NoteStyle} from '../data/chenleMessages';
export const NOTES_STORAGE_KEY='chenle-universe-notes-v1';
export const MESSAGE_MIN=20,MESSAGE_MAX=80;
export type NoteDraft={message:string;from?:string;location?:string;language:NoteLanguage};
export interface MessageRepository {
 listApproved():Promise<ChenleMessage[]>;
 submit(draft:NoteDraft):Promise<ChenleMessage>;
}
export type NoteStorage=Pick<Storage,'getItem'|'setItem'>;
const styles:NoteStyle[]=['sticky','star','polaroid','envelope','receipt','postcard'];
const languages=['zh','ko','en'];
export const noteLength=(value:string)=>Array.from(value.trim()).length;
export function validateNote(draft:NoteDraft):'message'|'name'|'location'|'language'|null {
 if(typeof draft.message!=='string'||noteLength(draft.message)<MESSAGE_MIN||noteLength(draft.message)>MESSAGE_MAX)return 'message';
 if(draft.from!==undefined&&(typeof draft.from!=='string'||Array.from(draft.from.trim()).length>24))return 'name';
 if(draft.location!==undefined&&(typeof draft.location!=='string'||Array.from(draft.location.trim()).length>32))return 'location';
 return languages.includes(draft.language)?null:'language';
}
function readNotes(storage:NoteStorage):ChenleMessage[]{
 const raw=storage.getItem(NOTES_STORAGE_KEY);if(!raw)return [];
 let data:unknown;try{data=JSON.parse(raw)}catch{throw Error('storage_corrupt')}
 if(!Array.isArray(data))throw Error('storage_corrupt');
 return data.filter((n):n is ChenleMessage=>!!n&&typeof n==='object'&&typeof n.id==='string'&&typeof n.from==='string'&&(!n.location||typeof n.location==='string')&&!validateNote(n)&&styles.includes(n.styleVariant)&&['approved','pending'].includes(n.status)&&n.source==='local');
}
// Local approval means visible on this device only; it never implies server moderation.
export function createLocalMessageRepository(storage:NoteStorage):MessageRepository {
 return {
  async listApproved(){return readNotes(storage).filter(n=>n.status==='approved')},
  async submit(draft){
   const error=validateNote(draft);if(error)throw Error(error);
   const notes=readNotes(storage);if(notes.length>=200)throw Error('storage_full');
   const note:ChenleMessage={id:crypto.randomUUID(),message:draft.message.trim(),from:draft.from?.trim()||'',location:draft.location?.trim()||'',language:draft.language,styleVariant:styles[notes.length%styles.length],createdAt:new Date().toISOString(),status:'approved',source:'local'};
   // A failed write rejects submission: no misleading saved confirmation.
   storage.setItem(NOTES_STORAGE_KEY,JSON.stringify([note,...notes]));return note;
  },
 };
}
// Backend adapters can implement this contract for Supabase/Firebase/Airtable/etc.
// The server must validate submissions, store them as pending and approve them separately.
export function createRemoteMessageRepository(endpoint:string,request:typeof fetch=fetch):MessageRepository {
 return {
  async listApproved(){const r=await request(endpoint,{cache:'no-store'});if(!r.ok)throw Error('load_failed');const data=await r.json();if(!Array.isArray(data))throw Error('invalid_response');return data.filter(n=>n?.status==='approved'&&typeof n.id==='string'&&!validateNote(n)&&styles.includes(n.styleVariant)).map(n=>({...n,source:'remote'}))},
  async submit(draft){const error=validateNote(draft);if(error)throw Error(error);const r=await request(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...draft,message:draft.message.trim()})});if(!r.ok)throw Error('submit_failed');const n=await r.json();if(n?.status!=='pending'||typeof n.id!=='string'||validateNote(n))throw Error('invalid_response');return {...n,source:'remote'}},
 };
}
