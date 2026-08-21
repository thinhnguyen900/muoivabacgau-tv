from PIL import Image, ImageStat
import json, math

with open('forge/evidence/browser-gate.json','r',encoding='utf-8') as f:
    meta=json.load(f)
g=meta['geometry']['stage']
img=Image.open('forge/evidence/forge-gate-1920x1080.png').convert('RGB')
box=(int(g['x']),int(g['y']),int(g['x']+g['w']),int(g['y']+g['h']))
crop=img.crop(box)
# Downsample for stable statistics.
small=crop.resize((160,100))
pix=list(small.getdata())
# A broken v7 screen was dominated by a nearly uniform neutral gray field.
grayish=sum(1 for r,g,b in pix if abs(r-g)<8 and abs(g-b)<8 and 110<=r<=190)/len(pix)
# Quantize to find any single dominant flat-color bucket.
from collections import Counter
bins=Counter((r//16,g//16,b//16) for r,g,b in pix)
dominant=bins.most_common(1)[0][1]/len(pix)
stat=ImageStat.Stat(small)
mean_std=sum(stat.stddev)/3
# Shannon entropy over quantized RGB bins.
entropy=0.0
for n in bins.values():
    p=n/len(pix)
    entropy-=p*math.log2(p)
checks={
    'grayish_fraction':grayish,
    'dominant_bucket_fraction':dominant,
    'mean_channel_stddev':mean_std,
    'quantized_entropy_bits':entropy,
    'crop_size':crop.size,
}
print(json.dumps(checks,indent=2))
if grayish>0.35:
    raise SystemExit('FAIL: intended character viewport is dominated by neutral gray')
if dominant>0.30:
    raise SystemExit('FAIL: intended character viewport is dominated by one flat color')
if mean_std<25 or entropy<3.5:
    raise SystemExit('FAIL: visual viewport lacks expected photographic variance')
with open('forge/evidence/visual-pixel-gate.json','w',encoding='utf-8') as f:
    json.dump({'ok':True,**checks},f,indent=2)
print('visual-pixel-gate PASS')
