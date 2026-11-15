export const ornamentAssets={
 mascot:'/assets/decor/chenle-mascot.webp',cat:'/assets/decor/chef-cat.webp',chenle:'/assets/decor/chenle-wave.webp',daegal:'/assets/decor/daegal.webp',basketball:'/assets/decor/basketball.webp',microphone:'/assets/decor/microphone.webp',dolphin:'/assets/decor/dolphin.webp',
 star:'/assets/decor/blue-star.webp',wing:'/assets/decor/pearl-wing.webp',luckyStar:'/assets/decor/yellow-star.webp',flower:'/assets/decor/spiral-flower.webp',clover:'/assets/decor/clover.webp',fish:'/assets/decor/fish.webp',key:'/assets/decor/heart-key.webp',butterfly:'/assets/decor/butterfly.webp',heart:'/assets/decor/bow-heart.webp',sparkle:'/assets/decor/blue-sparkle.webp',moon:'/assets/decor/moon.webp',bow:'/assets/decor/blue-bow.webp',
};
export type OrnamentId=keyof typeof ornamentAssets;
export type OrnamentTheme={character:OrnamentId;companion:OrnamentId;charms:[OrnamentId,OrnamentId,OrnamentId]};
export const pageOrnamentThemes:Record<string,OrnamentTheme>={
 opening:{character:'mascot',companion:'dolphin',charms:['luckyStar','heart','wing']},
 universe:{character:'chenle',companion:'daegal',charms:['star','moon','sparkle']},
 crossword:{character:'cat',companion:'key',charms:['flower','butterfly','star']},
 hoops:{character:'chenle',companion:'basketball',charms:['clover','luckyStar','sparkle']},
 years:{character:'chenle',companion:'microphone',charms:['bow','heart','wing']},
 gacha:{character:'mascot',companion:'cat',charms:['clover','key','luckyStar']},
 eyes:{character:'chenle',companion:'cat',charms:['heart','butterfly','bow']},
 fans:{character:'daegal',companion:'dolphin',charms:['moon','star','wing']},
 finale:{character:'chenle',companion:'mascot',charms:['luckyStar','wing','bow']},
 style:{character:'chenle',companion:'chenle',charms:['key','flower','butterfly']},
};
