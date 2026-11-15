"""Reproduce the real-video alpha frames and ordered bounded atlases.
Requires ffmpeg, ffprobe, Pillow, NumPy, SciPy. Raw PNGs remain outside public.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('--work',default='/workspace/work/chenle-sprite');a=p.parse_args()
source=Path(a.source);work=Path(a.work);raw=work/'raw';processed=work/'processed';out=Path('public/characters/chenle')
for d in [raw,processed,out,out/'frame-previews']:d.mkdir(parents=True,exist_ok=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(source)]));v=next(s for s in probe['streams'] if s['codec_type']=='video');n=int(v['nb_frames']);num,den=map(int,v['avg_frame_rate'].split('/'));fps=num/den
if len(list(raw.glob('frame_*.png')))!=n:subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(source),'-map','0:v:0','-fps_mode','passthrough',str(raw/'frame_%04d.png')],check=True)
roi=(320,690,760,1230);cell=448;target_height=384;masks=[];bounds=[];rgbs=[]
for f in sorted(raw.glob('frame_*.png')):
 rgb=np.array(Image.open(f).convert('RGB').crop(roi));c=rgb.astype(float)
 warm=(c[:,:,0]-c[:,:,1]>5)&(c[:,:,1]-c[:,:,2]>-8);white=(c.max(2)-c.min(2)<18)&(c.min(2)>170)
 strict=((c[:,:,0]-c[:,:,1]>15)&(c[:,:,1]-c[:,:,2]>-8))|((c.max(2)-c.min(2)<18)&(c.min(2)>225))
 fg=warm|white
 # Contact decorations behind left hair and the upper-right label need
 # tighter chroma discrimination; keep the gentler matte on skin/jaw.
 fg[125:265,:105]&=strict[125:265,:105];fg[:110,345:]&=strict[:110,345:];fg[100:245,380:]&=strict[100:245,380:]
 labels,_=nd.label(fg);sizes=np.bincount(labels.ravel());sizes[0]=0;mask=nd.binary_fill_holes(labels==sizes.argmax())
 yy,xx=np.where(mask);bounds.append([int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]);masks.append(mask);rgbs.append(rgb)
assert len(masks)==n
# Moving stickers can touch the hair for a few frames. A local temporal silhouette
# rejects only short-lived protrusions in the two contact bands. Brown hair is
# protected, and the face/jaw is never temporally cut or re-painted.
initial=masks[:];bounds=[]
for i,mask in enumerate(initial):
 temporal=np.median(np.stack(initial[max(0,i-8):min(n,i+9)]),axis=0)>=.5
 c=rgbs[i].astype(float);hair=(c[:,:,0]-c[:,:,1]>20)&(c[:,:,1]-c[:,:,2]>10)
 allowed=nd.binary_dilation(temporal,iterations=2)|hair
 band=np.zeros_like(mask);band[90:285,:105]=True;band[90:245,370:]=True
 mask=mask&(~band|allowed)
 lab,_=nd.label(mask);sz=np.bincount(lab.ravel());sz[0]=0;mask=nd.binary_fill_holes(lab==sz.argmax());masks[i]=mask
 yy,xx=np.where(mask);bounds.append([int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)])
b=np.array(bounds,dtype=float);centers=np.column_stack(((b[:,0]+b[:,2])/2,(b[:,1]+b[:,3])/2));heights=b[:,3]-b[:,1]
centers=nd.median_filter(centers,size=(3,1),mode='nearest');heights=nd.median_filter(heights,size=3,mode='nearest');records=[]
for i,(rgb,mask) in enumerate(zip(rgbs,masks)):
 c=rgb.astype(float);inside=nd.distance_transform_edt(mask);outside=nd.distance_transform_edt(~mask);core=inside>=3
 _,near=nd.distance_transform_edt(~core,return_indices=True);front=c[near[0],near[1]]
 blue=(c[:,:,2]-c[:,:,0]>20)&(outside>3)&(outside<25);background=np.median(c[blue],axis=0) if blue.any() else np.array([130,164,191])
 delta=front-background;alpha=np.clip(np.sum((c-background)*delta,axis=2)/np.maximum(100,np.sum(delta*delta,axis=2)),0,1)
 alpha=np.where(inside>=3,1,np.where(mask,np.maximum(.55,alpha),np.where(outside<=1.5,np.minimum(.35,alpha),0)));alpha=nd.gaussian_filter(alpha,.35)
 edge=(alpha>.025)&(alpha<.98);clean=c.copy();clean[edge]=np.clip((c[edge]-(1-alpha[edge,None])*background)/np.maximum(.025,alpha[edge,None]),0,255)
 rgba=np.dstack((clean.astype('uint8'),np.uint8(np.clip(alpha,0,1)*255)))
 image=Image.fromarray(rgba,'RGBA');scale=target_height/heights[i];cx,cy=centers[i]
 # Premultiplied resampling; only uniform scale/translation, no face/eye warps.
 image=image.convert('RGBa').transform((cell,cell),Image.Transform.AFFINE,(1/scale,0,cx-cell/2/scale,0,1/scale,cy-cell/2/scale),Image.Resampling.BICUBIC).convert('RGBA')
 image.save(processed/f'frame_{i+1:04d}.png')
 records.append({'index':i,'sourceFrame':i+1,'sourceTime':round(i/fps,6),'atlas':i//8,'x':(i%8%4)*cell,'y':(i%8//4)*cell,'width':cell,'height':cell,'sourceBounds':bounds[i],'transform':{'scale':round(float(scale),6),'center':[round(float(x),3) for x in centers[i]]}})
 if (i+1)%40==0:print('Matted',i+1,'/',n,flush=True)
atlases=[]
for start in range(1,n+1,8):
 count=min(8,n-start+1);num=(start-1)//8+1;png=work/f'atlas-{num:02d}.png'
 subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-start_number',str(start),'-i',str(processed/'frame_%04d.png'),'-vf',f'tile=4x2:nb_frames={count}:padding=0:margin=0:color=0x00000000','-frames:v','1',str(png)],check=True)
 path=out/f'spritesheet-{num:02d}.webp';Image.open(png).convert('RGBA').save(path,'WEBP',quality=94,method=6,exact=True)
 atlases.append({'id':num-1,'src':f'/characters/chenle/{path.name}','width':cell*4,'height':cell*2,'firstFrame':start-1,'frameCount':count,'bytes':path.stat().st_size});print('Packed atlas',num,flush=True)
def state(frames,**kw):return {'available':True,'frames':frames,**kw}
def missing(reason):return {'available':False,'frames':[],'replacement':None,'reason':reason}
states={'idle':state(list(range(11,22)),fps=12,loop='pingPong',description='真实正面轻微表情变化'),'center':state([21],description='正面自然微笑'),'left':state(list(range(40,54)),holdFrame=45,description='向画面左侧的真实侧目与转头'),**{k:missing('上传视频没有明确对应的视线/转头帧；保留资源入口，运行时回到正面，不宣称该方向已实现。') for k in ['top','bottom','right','topLeft','topRight','bottomLeft','bottomRight']},'expressionSmile':state(list(range(131,171)),fps=24,description='闭眼微笑，不标记为大笑'),'expressionBlink':state(list(range(21,30))+list(range(28,20,-1)),fps=30,description='真实双眼眨眼帧正放/倒放；没有伪造单眼 wink'),'expressionSurprised':state(list(range(171,193)),fps=24,description='睁大眼睛、张嘴惊讶'),'expressionPout':missing('末段只有轻微抿嘴/疑惑，不足以确认独立嘟嘴动画。参考图不是动画帧。')}
transitions={'centerToLeft':{'frames':list(range(21,46)),'fps':30,'from':'center','to':'left','continuous':True},'leftToCenter':{'frames':list(range(45,75)),'fps':30,'from':'left','to':'center','continuous':True}}
manifest={'version':1,'source':{'name':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'width':v['width'],'height':v['height'],'fps':fps,'frameCount':n,'videoDuration':float(v['duration']),'containerDuration':float(probe['format']['duration'])},'cellSize':cell,'columns':4,'rows':2,'defaultFrame':21,'idleImage':'/characters/chenle/idle.png','roi':list(roi),'alignment':{'targetHeadHeight':target_height,'method':'Uniform scale and head-bounds centering, 3-frame median; no face/eye deformation'},'originalHorizontalSheet':{'generated':False,'requiredWidth':n*cell,'requiredHeight':cell,'reason':'97216 px wide exceeds portable browser texture limits; ordered 1792x896 atlas segments preserve every original frame.'},'atlases':atlases,'frames':records,'states':states,'transitions':transitions,'segments':[{'sourceFrames':[1,22],'observed':'正面自然微笑'},{'sourceFrames':[23,35],'observed':'闭眼/眨眼并开始左转'},{'sourceFrames':[36,55],'observed':'向画面左侧侧目/转头'},{'sourceFrames':[56,75],'observed':'闭眼并回正'},{'sourceFrames':[76,132],'observed':'正面轻微表情变化'},{'sourceFrames':[133,171],'observed':'闭眼微笑'},{'sourceFrames':[172,193],'observed':'张嘴惊讶'},{'sourceFrames':[194,217],'observed':'轻微歪头、抿嘴/疑惑；不作为独立方向/嘟嘴'}]}
(out/'animation-map.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');Image.open(processed/'frame_0022.png').save(out/'idle.png')
for frame in [1,22,29,41,46,62,75,132,145,160,181,200,217]:Image.open(processed/f'frame_{frame:04d}.png').save(out/'frame-previews'/f'frame_{frame:04d}.png')
print('DONE:',n,'frames;',len(atlases),'atlases;',sum(x['bytes'] for x in atlases),'bytes',flush=True)
