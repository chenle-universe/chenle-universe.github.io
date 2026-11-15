import manifest from './download-manifest.json' with {type:'json'};
export async function downloadPackage(request,env){
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 if(!env.ASSETS)return new Response('Download unavailable',{status:503});
 const headers={'Content-Type':'application/zip','Content-Disposition':`attachment; filename="${manifest.filename}"`,'Content-Length':String(manifest.size),'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff','ETag':`"${manifest.sha256}"`};
 if(request.method==='HEAD')return new Response(null,{headers});
 let part=0,reader=null,cancelled=false;
 const stream=new ReadableStream({
  async pull(controller){
   try{
    for(;;){
     if(cancelled)return;
     if(!reader){if(part>=manifest.parts.length){controller.close();return}const response=await env.ASSETS.fetch(new Request(new URL(manifest.parts[part++].path,request.url)));if(!response.ok||!response.body)throw Error('Download segment unavailable');reader=response.body.getReader()}
     const {done,value}=await reader.read();if(done){reader.releaseLock();reader=null;continue}controller.enqueue(value);return;
    }
   }catch(error){controller.error(error);if(reader)await reader.cancel().catch(()=>{})}
  },
  async cancel(){cancelled=true;if(reader)await reader.cancel().catch(()=>{})}
 });
 return new Response(stream,{headers});
}
