import {birthdayLetter} from './birthdayLetter';
export type Lang='zh'|'ko';
export const worldProgress={required:['crossword','years','hoops','gacha','eyes'],allowPlaceholderCompletion:true};
export const worlds=[['crossword','Crossword Game','填字挑战','낱말 퀴즈','01'],['years','CHENLE CAM STUDIO','星光相机','별빛 카메라','02'],['hoops','HOOP DREAMS','投篮挑战','농구 챌린지','03'],['gacha','CHENLE FORTUNE GACHA','辰乐运势扭蛋','천러 행운 뽑기','04'],['eyes','WORDS FOR CHENLE','留言小册','작은 방명록','05'],['finale','THE BIRTHDAY STAR','生日礼物','생일 선물','06']];
export {crosswordQuestions} from './crossword';
export const photoArchive=[['LITTLE CHENLE','2001–2015'],['ROOKIE CHENLE','2016–2018'],['GROWING UP','2019–2021'],['FINDING HIS OWN WAY','2022–2024'],['RIGHT HERE, RIGHT NOW','2025–2026']].map(([title,years],i)=>({title,years,photos:[0,1,2].map(n=>({src:'',alt:`${title} ${n+1}`,id:`archive-${i}-${n}`})),comment:{zh:'每一段成长，都值得一起珍藏。',ko:'천러의 모든 순간을 함께 응원해요.'}}));
export const birthdayMessages={letter:birthdayLetter.body,wish:{zh:'愿你的新一岁，充满自由、音乐和快乐。',ko:'새로운 한 해가 자유와 음악, 행복으로 가득하길.'}};
