import assert from 'node:assert/strict';
import {initialLandingPage} from '../lib/birthday-gift.ts';
const complete=['crossword','hoops','years','gacha','eyes'];
for(const stars of [[],complete]){
 assert.equal(initialLandingPage('',stars),'opening','Ordinary homepage visits start with the opening regardless of saved progress');
 assert.equal(initialLandingPage('unknown',stars),'opening');assert.equal(initialLandingPage('opening',stars),'opening');
 for(const page of ['universe','crossword','hoops','years','gacha','eyes','fans'])assert.equal(initialLandingPage(page,stars),page,'Explicit module links still work');
}
assert.equal(initialLandingPage('style',[]),'universe');assert.equal(initialLandingPage('finale',[]),'universe');assert.equal(initialLandingPage('style',complete),'style');assert.equal(initialLandingPage('finale',complete),'finale');assert.equal(complete.length,5,'Navigation leaves saved stars intact');
console.log('PASS: homepage always opens the birthday intro; explicit links and birthday locks remain correct; progress preserved.');
