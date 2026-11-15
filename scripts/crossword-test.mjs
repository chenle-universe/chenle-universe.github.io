import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {crosswordQuestions} from '../data/crossword.ts';
import {generateCrossword,validateCrossword} from '../lib/crossword.mjs';
const answers=crosswordQuestions.map(q=>q[0]);
assert.deepEqual(answers,['SHANGHAI','DOLPHIN','CHEWINGGUM','PIANO','CURRY','DAEGAL','EGGS','MANDARIN','TWO','AIRPODS','RING','AKDONG']);
const layout=generateCrossword(answers);validateCrossword(layout,answers);
writeFileSync('data/crossword-layout.json',JSON.stringify(layout,null,2)+'\n');
console.log(`PASS: all 12 public TMI answers; ${layout.width} × ${layout.height} connected crossword generated.`);
