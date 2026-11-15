/** Birthday Star and its dress-up gift share the existing five-star unlock rule. */
export function birthdayGiftLocked(page:string,stars:readonly string[]):boolean {
 return (page==='finale'||page==='style')&&stars.length<5;
}

/** Homepage visits always start with the birthday opening; progress never skips it. */
export function initialLandingPage(hash:string,stars:readonly string[]):string {
 const pages=['opening','universe','crossword','hoops','years','gacha','eyes','fans','finale','style'];
 if(!pages.includes(hash))return 'opening';
 return birthdayGiftLocked(hash,stars)?'universe':hash;
}
