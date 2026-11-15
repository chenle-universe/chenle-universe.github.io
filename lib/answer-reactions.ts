export type AnswerReactions={primed:boolean;seen:number[];queue:number[]};
export const initialReactions:AnswerReactions={primed:false,seen:[],queue:[]};
export function advanceReactions(state:AnswerReactions,correct:number[],ready:boolean):AnswerReactions{if(!ready)return state;if(!state.primed)return {primed:true,seen:[...correct],queue:[]};const fresh=correct.filter(id=>!state.seen.includes(id)&&!state.queue.includes(id));if(!fresh.length&&state.seen.join(',')===correct.join(','))return state;return {primed:true,seen:[...correct],queue:[...state.queue,...fresh]}}
export function enqueueReaction(state:AnswerReactions,id:number):AnswerReactions{return state.queue.includes(id)?state:{...state,queue:[...state.queue,id]}}
