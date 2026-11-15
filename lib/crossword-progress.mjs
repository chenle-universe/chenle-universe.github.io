export const CROSSWORD_VERSION = 'chenle-tmi-2026-11-v2';
export const CROSSWORD_STORAGE_KEY = `chenleland-fans-crossword-${CROSSWORD_VERSION}`;
export const WORLD_STORAGE_KEY = 'chenleland-fans-world-v1';
export const LEGACY_CROSSWORD_KEYS = ['chenleland-fans-crossword-v1','chenleland-crossword'];
// Called during world hydration, before star-gated navigation is enabled.
// Only this game's old completion is invalidated; other games keep their progress.
export function migrateCrosswordProgress(storage) {
 let world={};try{const raw=JSON.parse(storage.getItem(WORLD_STORAGE_KEY)||'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw))world=raw}catch{}
 if(world.crosswordVersion!==CROSSWORD_VERSION){
  world={...world,stars:Array.isArray(world.stars)?world.stars.filter(id=>id!=='crossword'):[],crosswordVersion:CROSSWORD_VERSION};
  try{for(const key of LEGACY_CROSSWORD_KEYS)storage.removeItem(key);storage.removeItem(CROSSWORD_STORAGE_KEY);storage.setItem(WORLD_STORAGE_KEY,JSON.stringify(world))}catch{}
 }
 return world;
}
