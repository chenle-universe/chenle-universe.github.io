import {cpSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
rmSync('dist',{recursive:true,force:true});mkdirSync('dist/server',{recursive:true});
cpSync('out','dist/client',{recursive:true});
// Superseded collage variants have no runtime references; retain their source copies only.
for(const asset of ['chenle-photo-collage.png','chenle-photo-collage-mobile.png'])rmSync('dist/client/assets/notes/'+asset,{force:true});const shared=readFileSync('lib/note-design.mjs','utf8').replace(/^export /gm,'');
const noteExamples='const noteTranslations='+readFileSync('data/noteTranslations.json','utf8')+';';
const notes=readFileSync('worker/notes.mjs','utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const download=readFileSync('worker/download.mjs','utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const manifest='const manifest='+readFileSync('worker/download-manifest.json','utf8')+';';
const entry=readFileSync('worker/index.mjs','utf8').replace(/^import .*;\n/gm,'');
writeFileSync('dist/server/index.js',[shared,noteExamples,notes,manifest,download,entry].join('\n'));
cpSync('drizzle','dist/server/drizzle',{recursive:true});
writeFileSync('dist/server/package.json',JSON.stringify({type:'module'}));
writeFileSync('dist/server/wrangler.json',JSON.stringify({name:'chenleland-fans',main:'index.js',compatibility_date:'2026-11-01',assets:{directory:'../client',binding:'ASSETS',run_worker_first:['/api/*','/downloads/*']},d1_databases:[{binding:'DB',database_name:'chenleland-fans',database_id:'local',migrations_dir:'drizzle'}]},null,2));
console.log('Worker, static assets and database migrations packaged.');
