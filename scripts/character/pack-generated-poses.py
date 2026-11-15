from PIL import Image
import numpy as np,json
from scipy import ndimage as nd
from pathlib import Path
out=Path('public/characters/chenle');cells=[]
for path,cols,rows in [('/workspace/generated_images/exec-212fe613-7944-44e1-8ca6-476899a66a2d.png',3,3),('/workspace/generated_images/exec-0663513c-3c8a-48c3-8770-d62a5c1b150c.png',3,1)]:
 im=Image.open(path).convert('RGBA')
 for y in range(rows):
  for x in range(cols):
   tile=im.crop((round(x*im.width/cols),round(y*im.height/rows),round((x+1)*im.width/cols),round((y+1)*im.height/rows)))
   a=np.array(tile);mask=a[:,:,3]>40;l,_=nd.label(mask);s=np.bincount(l.ravel());s[0]=0;main=l==s.argmax();keep=nd.binary_dilation(main,iterations=1);a[:,:,3][~keep]=0;a[:,:,3][a[:,:,3]<12]=0
   tile=Image.fromarray(a);bbox=Image.fromarray(np.uint8(main)*255).getbbox();tile=tile.crop(bbox);ratio=384/tile.height
   tile=tile.convert('RGBa').resize((round(tile.width*ratio),384),Image.Resampling.LANCZOS).convert('RGBA');cell=Image.new('RGBA',(448,448));cell.alpha_composite(tile,((448-tile.width)//2,32));cells.append(cell)
atlas=Image.new('RGBA',(1344,1792))
for i,c in enumerate(cells):atlas.alpha_composite(c,((i%3)*448,(i//3)*448))
atlas.save(out/'poses.webp','WEBP',lossless=True,method=6);cells[4].save(out/'pose-idle.png')
map={'version':2,'provenance':'Newly generated poses and expressions using the supplied reference; not missing frames recovered from video.','atlas':'/characters/chenle/poses.webp','center':4,'frames':[{'x':i%3*448,'y':i//3*448,'width':448,'height':448} for i in range(12)],'directions':dict(zip(['topLeft','top','topRight','left','center','right','bottomLeft','bottom','bottomRight'],range(9))),'expressions':[{'name':'blink','frame':9},{'name':'smile','frame':10},{'name':'surprised','frame':11}],'transition':'160ms aligned pose crossfade, not continuous video motion'}
(out/'pose-map.json').write_text(json.dumps(map,ensure_ascii=False,indent=2)+'\n')
print('Single atlas bytes:',(out/'poses.webp').stat().st_size)
