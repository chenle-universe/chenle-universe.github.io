import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';
import sharp from 'sharp';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chooseMemoryPhoto } from '../lib/memory-gacha.ts';

// Compile local TS/TSX so the real data and result component can be checked in Node.
const require = createRequire(import.meta.url);
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => {
  const source = readFileSync(filename, 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, resolveJsonModule: true,
  }});
  module._compile(result.outputText, filename);
};
const { memoryGachaPhotos: photos } = require('../data/memoryGacha.ts');
const Result = require('../components/gacha/MemoryGachaResult.tsx').default;
const assets = require('../data/memoryGacha.assets.json');
const expectedFiles = ['photo-01.png', 'photo-02.png', ...Array.from({ length: 8 }, (_, i) => `photo-${String(i + 3).padStart(2, '0')}.JPG`)];
assert.deepEqual(readdirSync('public/images/memory-gacha').sort(), expectedFiles);
assert.equal(photos.length, 10);
assert.equal(new Set(photos.map(photo => photo.id)).size, 10);
let landscape = 0, portrait = 0;
for (let i = 0; i < photos.length; i++) {
  const photo = photos[i];
  assert.equal(photo.id, `photo-${String(i + 1).padStart(2, '0')}`);
  assert.equal(path.basename(photo.image), expectedFiles[i], 'The numbered original file binds to the same caption record');
  const bytes = readFileSync(`public${photo.image}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), assets[photo.id].sha256, `${photo.id}: original bytes preserved`);
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.width, photo.width);
  assert.equal(metadata.height, photo.height);
  await sharp(bytes).stats(); // Decode the entire image, not just its header.
  if (photo.width > photo.height) landscape++; else portrait++;
  assert.ok(photo.captionZh && photo.captionKo);
  const imageSources = [];
  for (const lang of ['zh', 'ko']) {
    const markup = renderToStaticMarkup(React.createElement(Result, {
      photo, lang, capsuleSrc: '/assets/gacha/capsule-basketball.webp', edge: i % 4, onAgain() {},
    }));
    const caption = lang === 'zh' ? photo.captionZh : photo.captionKo;
    assert.ok(markup.includes(caption), `${photo.id}: exact ${lang} caption rendered`);
    assert.ok(!markup.includes(photo.title), 'Internal English title must not appear in the result');
    assert.ok(markup.includes('ONE MORE?'));
    assert.ok(markup.includes(`edge-${i % 4}`), 'Language switch preserves the capsule position');
    imageSources.push(markup.match(/src="(\/images\/memory-gacha\/[^\"]+)"/)[1]);
  }
  assert.equal(imageSources[0], photo.image);
  assert.equal(imageSources[1], photo.image, 'Language switch preserves the same photo');
}
assert.equal(landscape, 1);
assert.equal(portrait, 9);
// Exercise every equal-sized probability interval for every possible prior draw.
for (const previous of [null, ...photos.map(photo => photo.id)]) {
  const eligible = photos.filter(photo => photo.id !== previous);
  const counts = new Map(eligible.map(photo => [photo.id, 0]));
  for (let n = 0; n < eligible.length * 100; n++) {
    const picked = chooseMemoryPhoto(photos, previous, () => (n + .5) / (eligible.length * 100));
    assert.notEqual(picked.id, previous);
    counts.set(picked.id, counts.get(picked.id) + 1);
  }
  assert.ok([...counts.values()].every(count => count === 100), 'All eligible photos have equal draw probability');
}
assert.equal(chooseMemoryPhoto([photos[0]], photos[0].id).id, photos[0].id);
const first = chooseMemoryPhoto(photos, null, () => 0);
const second = chooseMemoryPhoto(photos, first.id, () => 0);
assert.equal(chooseMemoryPhoto(photos, second.id, () => 0).id, first.id, 'A later round can repeat a photo');
assert.throws(() => chooseMemoryPhoto([], null));
console.log('PASS: all 10 originals decode, hashes/numbered bindings match, bilingual results preserve photo/mini capsule, titles stay internal, and equal-probability draws avoid consecutive repeats.');
