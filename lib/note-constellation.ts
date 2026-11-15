// Keep touch targets well separated at both narrow and wide aspect ratios.
export const noteStarPositions = [
 [18,17],[51,11],[82,23],[33,37],[68,40],
 [13,57],[87,60],[48,62],[28,82],[73,84],
] as const;
export function noteStarAppearance(id:string){let hash=0;for(const c of id)hash=(hash*31+c.charCodeAt(0))>>>0;return {size:36+hash%11,delay:-(hash%60)/10,color:['#e1edff','#f0ddff','#d5f4ff','#ffe8f5'][hash%4]}}
export const noteMeteorKinds=['basketball','microphone','dolphin','headphones','music','puppy'] as const;
