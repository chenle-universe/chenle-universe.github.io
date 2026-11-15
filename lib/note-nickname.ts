import type {Lang} from '../data/content';
import type {ChenleMessage} from '../data/chenleMessages';
const nicknames = [
 ['一颗小太阳','작은 태양 하나'],['一颗小星星','작은 별 하나'],['Daegal 监护人','대갈이 보호자'],
 ['海豚饲养员','돌고래 돌보미'],['辰乐的耳机','천러의 이어폰'],['一颗小土豆','작은 감자 하나'],
 ['篮球场路过的云','농구장 위 구름'],['1122号小行星','1122번 소행성'],['大头零食管理员','대갈이 간식 담당'],
 ['快乐音量管理员','행복 볼륨 담당'],['一封月亮来信','달에서 온 편지'],['梦队应援小分队','드림 응원단'],
] as const;
/** UUID-derived pseudorandom choice keeps anonymous names stable on reload and across views. */
export function noteNickname(note:Pick<ChenleMessage,'id'|'from'>,lang:Lang):string {
 const name=note.from?.trim();if(name)return name;
 let hash=2166136261;for(const char of note.id)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return nicknames[(hash>>>0)%nicknames.length][lang==='zh'?0:1];
}
