import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
const require=createRequire(import.meta.url);
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,filename)=>module._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
const {ornamentAssets,pageOrnamentThemes}=require('../data/pageOrnaments.ts');
const Ornaments=require('../components/PageOrnaments.tsx').default;
for(const page of ['opening','universe','crossword','hoops','years','gacha','eyes','fans','finale','style']){
 assert.ok(pageOrnamentThemes[page]);
 for(const position of ['top','bottom']){
 const html=renderToStaticMarkup(React.createElement(Ornaments,{page,position}));
 assert.ok(html.includes('aria-hidden="true"'));assert.ok(!/<button|<a\s/.test(html));
 for(const [,src] of html.matchAll(/<img[^>]+src="([^"]+)"/g))assert.ok(existsSync(`public${src}`),src);
 }
}
for(const src of Object.values(ornamentAssets)){
 const meta=await sharp(`public${src}`).metadata();assert.ok(meta.hasAlpha);assert.ok(meta.width<=320&&meta.height<=320);
 const {data,info}=await sharp(`public${src}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let transparent=0,visible=0;for(let i=3;i<data.length;i+=info.channels){if(data[i]===0)transparent++;if(data[i]>200)visible++}assert.ok(transparent>100&&visible>100);
}
const {scatterOrnaments}=require('../lib/ornament-layout.ts');
for(const [width,height] of [[375,1400],[721,1800],[1440,1100]]){
 const blocked=[{x:width*.2,y:120,width:width*.6,height:height-250}];
 const layouts=[];
 for(const seed of [.12,.37,.88]){
 const placements=scatterOrnaments(width,height,blocked,seed);assert.ok(placements.length>0);layouts.push(placements);
 for(const p of placements){assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=width&&p.y+p.height<=height);for(const r of blocked)assert.ok(p.x+p.width+26<=r.x||p.x>=r.x+r.width+26||p.y+p.height+26<=r.y||p.y>=r.y+r.height+26)}
 assert.deepEqual(scatterOrnaments(width,height,blocked,seed),placements,'Stable within a page visit');
 }
 assert.notDeepEqual(layouts[0],layouts[1],'Different visits have different scattered positions');
}
assert.ok(!Object.keys(ornamentAssets).includes('friends'));assert.ok(!Object.keys(ornamentAssets).includes('hug'));
for(const theme of Object.values(pageOrnamentThemes))assert.ok(!['friends','hug'].includes(theme.character));
const css=readFileSync('app/page-ornaments.css','utf8');assert.ok(css.includes('pointer-events:none'));assert.ok(css.includes('prefers-reduced-motion'));assert.ok(!css.includes('position:fixed'));
console.log('All 10 themes use single-character stickers; randomized layouts avoid content at mobile, tablet and desktop widths.');
