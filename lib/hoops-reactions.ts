export const allReactionScenes = ['encourage','cheer','comfort','fistbump','together','dribble','jumpshot','celebrate','point','pass','duo-bump','duo-comfort','sigh'] as const;
export type ReactionScene = typeof allReactionScenes[number];
export type ReactionMood = 'encourage' | 'cheer' | 'comfort';
export const reactionPools: Record<ReactionMood, readonly ReactionScene[]> = {
 encourage: ['encourage','dribble','jumpshot','point','pass','together'],
 cheer: ['cheer','celebrate','point','fistbump','duo-bump','together'],
 comfort: ['comfort','duo-comfort','sigh'],
};
export function createReactionPicker(random= Math.random) {
 const bags: Partial<Record<ReactionMood, ReactionScene[]>> = {};
 let previous: ReactionScene = 'encourage';
 function shuffled(pool: readonly ReactionScene[]) {
  const result=[...pool];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result;
 }
 return {pick(mood:ReactionMood):ReactionScene {
  let bag=bags[mood];if(!bag?.length)bag=bags[mood]=shuffled(reactionPools[mood]);
  let index=bag.findIndex(scene=>scene!==previous);
  if(index<0){bag=bags[mood]=shuffled(reactionPools[mood]);index=bag.findIndex(scene=>scene!==previous)}
  const scene=bag.splice(index,1)[0];previous=scene;return scene;
 }};
}
