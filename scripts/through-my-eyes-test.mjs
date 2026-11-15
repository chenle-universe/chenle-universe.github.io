import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire,Module} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(module,filename)=>{
  const code=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  module._compile(code,filename);
};
const {throughMyEyesSections:sections,scrapbookCopy,scrapbookEdition}=require('../data/throughMyEyes.ts');
assert.equal(sections.length,6);
assert.equal(new Set(sections.map(s=>s.layoutType)).size,6,'Every chapter has its own layout');
const ids=[];
for(const section of sections){
  assert.ok(section.title&&section.subtitle.zh&&section.subtitle.ko&&section.intro.zh&&section.intro.ko);
  for(const key of ['images','notes','quotes','stickers'])assert.ok(Array.isArray(section[key]));
  ids.push(section.id,...section.images.map(i=>i.id),...section.notes.map(n=>n.id),...section.quotes.map(q=>q.id),...section.stickers.map(s=>s.id));
  for(const image of section.images){assert.ok(!image.src||image.src.startsWith('/images/through-my-eyes/'),'Only intentional scrapbook assets may replace placeholders');if(image.src)assert.ok(existsSync(`public${image.src}`),`Missing real image: ${image.id}`);assert.ok(image.alt.zh&&image.alt.ko&&image.caption.zh&&image.caption.ko);}
  assert.ok(section.notes.some(n=>n.folded)||section.layoutType==='final-note'||section.layoutType==='first-impression');
  for(const quote of section.quotes)assert.equal(quote.sample,true,'Example quotations must be identified');
}
assert.equal(new Set(ids).size,ids.length,'All editable content IDs must be unique');

// Exercise real component handlers with deterministic React hook storage. Browser
// layout/native dialog behavior are deliberately outside this Node-only harness.
function reader(completed=false){
  const slots=[];let cursor=0,rewards=0,lang='zh';
  const hooks={
    useState(initial){const id=cursor++;if(!(id in slots))slots[id]=typeof initial==='function'?initial():initial;return[slots[id],value=>{slots[id]=typeof value==='function'?value(slots[id]):value}];},
    useRef(initial){const id=cursor++;return slots[id]??=( {current:initial} );},
    useId(){return `test-${cursor++}`;},useEffect(){},
  };
  const filename=fileURLToPath(new URL('../components/ThroughMyEyes.tsx',import.meta.url));
  const mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(filename.substring(0,filename.lastIndexOf('/')));
  const nativeRequire=mod.require.bind(mod);mod.require=id=>id==='react'?hooks:nativeRequire(id);
  mod._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
  return {render(nextLang=lang){lang=nextLang;cursor=0;return mod.exports.default({lang,completed,onComplete:()=>rewards++});},get rewards(){return rewards}};
}
function nodes(node){if(Array.isArray(node))return node.flatMap(nodes);if(!node||typeof node!=='object'||!node.props)return[];return[node,...nodes(node.props.children)]}
function find(tree,className){const node=nodes(tree).find(n=>n.props.className?.split(' ').includes(className));assert.ok(node,`Missing ${className}`);return node}
function chapterButtons(tree){return nodes(find(tree,'eyes-chapter-tabs')).filter(n=>n.type==='button')}
function currentArticle(tree){return nodes(tree).find(n=>n.type==='article'&&n.props['aria-hidden']===false)}
const r=reader();let tree=r.render();
assert.equal(chapterButtons(tree)[0].props['aria-current'],'page');
const firstHtml=renderToStaticMarkup(tree);
assert.ok(!firstHtml.includes(scrapbookCopy.zh.previewNote),'The removed preview notice must stay absent');
assert.ok(!firstHtml.includes('notes · collages · you'),'The removed masthead caption must stay absent');
assert.ok(firstHtml.includes('cover-music-dolphin.webp'),'The supplied-photo cover is actually rendered');
assert.equal(sections[0].images.length,1);
assert.ok(sections[0].images[0].src,'The cover cannot be a placeholder');
assert.ok(firstHtml.includes('<details'));
assert.ok(firstHtml.includes('aria-expanded="false"')&&firstHtml.includes('hidden=""'));
assert.equal(nodes(tree).filter(n=>n.type==='article').length,6,'All six papers are on the continuous horizontal rail');
const designKeys=new Set();
for(let i=0;i<sections.length;i++){
  chapterButtons(tree)[i].props.onClick();tree=r.render();
  assert.equal(chapterButtons(tree)[i].props['aria-current'],'page');
  const active=currentArticle(tree);
  assert.ok(nodes(tree).filter(n=>n.type==='article'&&n!==active).every(n=>n.props.inert),'Offscreen pages cannot receive focus');
  const design=nodes(active).find(n=>n.props['data-design']);assert.ok(design);designKeys.add(design.props['data-design']);
  const photos=nodes(design).filter(n=>typeof n.type==='function'&&n.type.name==='PhotoTile');
  assert.deepEqual(photos.map(n=>n.props.image.id).sort(),sections[i].images.map(image=>image.id).sort(),'Every image remains bound to its page');
  const notes=nodes(design).filter(n=>typeof n.type==='function'&&n.type.name==='PaperNote');
  assert.deepEqual(notes.map(n=>n.props.note.id).sort(),sections[i].notes.map(note=>note.id).sort());
  assert.equal(find(active,'eyes-intro').props.children,sections[i].intro.zh);
  tree=r.render('ko');assert.equal(chapterButtons(tree)[i].props['aria-current'],'page','Language switch preserves current paper');
  assert.equal(find(currentArticle(tree),'eyes-intro').props.children,sections[i].intro.ko);
  tree=r.render('zh');
}
assert.equal(designKeys.size,6,'The zine retains six independent page designs');
find(tree,'eyes-star-button').props.onClick();find(tree,'eyes-star-button').props.onClick();
assert.equal(r.rewards,1);tree=r.render();assert.equal(find(tree,'eyes-star-button').props.disabled,true);
const already=reader(true);let done=already.render();chapterButtons(done)[5].props.onClick();done=already.render();assert.equal(find(done,'eyes-star-button').props.disabled,true);find(done,'eyes-star-button').props.onClick();assert.equal(already.rewards,0);
chapterButtons(tree)[0].props.onClick();tree=r.render();
const photo=nodes(currentArticle(tree)).find(n=>typeof n.type==='function'&&n.type.name==='PhotoTile');photo.props.onZoom();tree=r.render();
assert.ok(nodes(find(tree,'eyes-photo-dialog')).some(n=>n.type==='figure'));
tree=r.render('ko');assert.ok(nodes(find(tree,'eyes-photo-dialog')).some(n=>n.type==='figure'),'Language changes retain zoom');
find(tree,'eyes-close-photo').props.onClick();tree=r.render();assert.equal(nodes(find(tree,'eyes-photo-dialog')).some(n=>n.type==='figure'),false);
let prevented=false;tree.props.onKeyDown({key:'ArrowRight',preventDefault(){prevented=true}});tree=r.render();assert.ok(prevented);assert.equal(chapterButtons(tree)[1].props['aria-current'],'page');
// Native touch/trackpad scrolling updates the active page. Vertical page reading
// leaves scrollLeft unchanged, and resizing is handled by a real ResizeObserver.
for(const [left,width,expected] of [[750,375,2],[758,375,2],[1500,375,4],[3000,600,5],[-15,600,0]]){
  find(tree,'eyes-page-track').props.onScroll({currentTarget:{scrollLeft:left,clientWidth:width}});tree=r.render();
  assert.equal(chapterButtons(tree)[expected].props['aria-current'],'page');
}
let targetLeft=0;
const rail={style:{},scrollLeft:0,clientWidth:375,setPointerCapture(){},hasPointerCapture(){return true},releasePointerCapture(){},scrollTo({left}){targetLeft=left;this.scrollLeft=left;}};
find(tree,'eyes-page-track').props.ref.current=rail;
find(tree,'eyes-page-track').props.onPointerDown({pointerType:'mouse',button:0,pointerId:1,clientX:350,currentTarget:rail,target:{closest:()=>null}});
find(tree,'eyes-page-track').props.onPointerMove({pointerId:1,clientX:60,currentTarget:rail,preventDefault(){}});
assert.equal(rail.scrollLeft,290,'Mouse dragging follows horizontal movement');
find(tree,'eyes-page-track').props.onPointerUp({pointerId:1,currentTarget:rail});tree=r.render();assert.equal(targetLeft,375);assert.equal(chapterButtons(tree)[1].props['aria-current'],'page');
let clickPrevented=false;
find(tree,'eyes-page-track').props.onClickCapture({preventDefault(){clickPrevented=true},stopPropagation(){}});assert.ok(clickPrevented,'Dragging must not accidentally open the photo');
find(tree,'eyes-page-track').props.onPointerDown({pointerType:'touch'});
find(tree,'eyes-page-track').props.onPointerMove({pointerId:2,clientX:100,currentTarget:rail,preventDefault(){throw Error('Native touch should remain native')}});
const css=readFileSync('app/eyes-reader.css','utf8');assert.ok(css.includes('scroll-snap-type:x mandatory')&&css.includes('scroll-snap-align:start'));assert.ok(css.includes('prefers-reduced-motion'));
console.log('PASS: real-photo cover; six independent zine pages; horizontal scroll-snap/drag/keyboard navigation; offscreen focus protection; stable language/zoom; exact content binding; one-time persisted reward.');
