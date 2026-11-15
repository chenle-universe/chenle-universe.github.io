const apiOrigin=process.env.NEXT_PUBLIC_API_ORIGIN||'';
const basePath=process.env.NEXT_PUBLIC_BASE_PATH||'';
export function siteAsset(path:string){return basePath&&path.startsWith('/')&&!path.startsWith('//')&&!path.startsWith(basePath+'/')?basePath+path:path}
export function siteFetch(path:string,init:RequestInit={}){
 if(!apiOrigin||!path.startsWith('/api/'))return fetch(path.startsWith('/api/')?path:siteAsset(path),init);
 if(path==='/api/notes/translate')return fetch(apiOrigin+path,{...init,credentials:'omit'});
 const headers=new Headers(init.headers);
 let visitor=localStorage.getItem('chenle-pages-visitor');
 if(!visitor){visitor=crypto.randomUUID();localStorage.setItem('chenle-pages-visitor',visitor)}
 headers.set('X-Note-Visitor',visitor);
 return fetch(apiOrigin+path,{...init,headers,credentials:'omit'});
}
