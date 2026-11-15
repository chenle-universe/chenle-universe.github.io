import {allReactionScenes} from './hoops-reactions.ts';
export const finaleScenes = allReactionScenes;
export type FinaleScene = typeof finaleScenes[number];

export function chooseFinale(previous: FinaleScene | null, random = Math.random): FinaleScene {
  const available = finaleScenes.filter(scene => scene !== previous);
  return available[Math.min(available.length - 1, Math.floor(random() * available.length))];
}
