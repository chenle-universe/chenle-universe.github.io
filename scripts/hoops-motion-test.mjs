import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { advanceCourt, hoopAtPhase } from '../lib/hoops-motion.ts';
import { aimedShot, makeBall, previewShot } from '../lib/shot-aim.ts';
import { chooseFinale, finaleScenes } from '../lib/hoops-finale.ts';

for (const flying of [false, true]) for (const dt of [1 / 120, 1 / 60, .025]) {
  const court = { phase: .2, hoop: hoopAtPhase(.2), ball: flying ? aimedShot(200) : makeBall() };
  const initial = court.hoop;
  for (let i = 0; i < Math.round(.6 / dt); i++) {
    advanceCourt(court, dt);
    assert.ok(Math.abs(court.hoop - hoopAtPhase(court.phase)) < 1e-10);
    assert.ok(court.hoop >= 145 && court.hoop <= 255);
  }
  assert.ok(court.hoop - initial > 25, `${flying ? 'Flying' : 'Held/ready'} ball must not pause hoop motion`);
  assert.equal(court.ball.flying, flying);
}
// Scoring uses the hoop's position on this frame, rather than its old location.
for (const gold of [false, true]) {
  const court = { phase: Math.PI / 2, hoop: 200, ball: { ...makeBall(), x: 255, y: 162, vy: 150, flying: true, gold } };
  assert.equal(advanceCourt(court, .01), gold ? 5 : 2);
  assert.equal(advanceCourt(court, .01), 0, 'A basket only scores once');
}
for (const phase of [0, .7, 1.5, 2.5, 3.7, 5.2]) {
  let hittable = false, missable = false;
  for (let target = 60; target <= 340; target += 10) {
    const preview = previewShot(target, 650, hoopAtPhase(phase), phase);
    const court = { phase, hoop: hoopAtPhase(phase), ball: aimedShot(target, 650) };
    let score = 0;
    for (let i = 0; i < 300; i++) score += advanceCourt(court, 1 / 120);
    assert.equal(preview.hit, score > 0, 'Preview and live ball agree for a moving hoop');
    hittable ||= score > 0;
    missable ||= score === 0;
  }
  assert.ok(hittable && missable, 'A moving hoop permits real makes and misses');
}
assert.equal(finaleScenes.length, 13);
for (const scene of finaleScenes) {
  const file = `public/assets/hoops/curry-${scene}.gif`;
  assert.ok(existsSync(file));
  assert.equal(readFileSync(file).subarray(0, 3).toString(), 'GIF');
}
for (const previous of [null, ...finaleScenes]) {
  const available = finaleScenes.filter(scene => scene !== previous);
  const selected = available.map((_, i) => chooseFinale(previous, () => (i + .5) / available.length));
  assert.deepEqual(selected, available, 'Every existing action can be selected with equal probability, without repeating the previous finale');
}
console.log('PASS: hoop keeps moving while aiming/flying at 40–120fps; live moving-rim scoring and preview agree; all thirteen finale GIFs are available without immediate repeats.');
