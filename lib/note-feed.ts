import type {ChenleMessage} from '../data/chenleMessages';
export function publicNoteFeed(value:unknown):ChenleMessage[]{
 if(!Array.isArray(value)||value.some(n=>!n||typeof n.id!=='string'||typeof n.message!=='string'||n.visibility==='private'||n.status!=='approved'||n.source!=='remote'))throw Error('invalid_public_feed');
 return value;
}
export function startNoteFeedRefresh(refresh:()=>void,host:Pick<Window,'addEventListener'|'removeEventListener'|'setInterval'|'clearInterval'>,document:Pick<Document,'hidden'|'addEventListener'|'removeEventListener'>){
 const update=()=>{if(!document.hidden)refresh()};
 const timer=host.setInterval(update,15000);
 host.addEventListener('focus',update);document.addEventListener('visibilitychange',update);update();
 return()=>{host.clearInterval(timer);host.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update)};
}
