from PIL import Image, ImageStat
import json, math
from collections import Counter

with open('forge/evidence/browser-gate.json','r',encoding='utf-8') as f:
    meta=json.load(f)
g=meta['geometry']['stage']
img=Image.open('forge/evidence/forge-gate-1920x1080.png').convert('RGB')
box=(int(g['x']),int(g['y']),int(g['x']+g['w']),int(g['y']+g['h']))
crop=img.crop(box)

def metrics(im, size=(160,100)):
    small=im.resize(size)
    pix=list(small.getdata())
    grayish=sum(1 for r,g,b in pix if abs(r-g)<8 and abs(g-b)<8 and 110<=r<=190)/len(pix)
    bins=Counter((r//16,g//16,b//16) for r,g,b in pix)
    dominant=bins.most_common(1)[0][1]/len(pix)
    stat=ImageStat.Stat(small)
    mean_std=sum(stat.stddev)/3
    entropy=0.0
    for n in bins.values():
        p=n/len(pix)
        entropy-=p*math.log2(p)
    return {
        'grayish_fraction':grayish,
        'dominant_bucket_fraction':dominant,
        'mean_channel_stddev':mean_std,
        'quantized_entropy_bits':entropy,
        'crop_size':im.size,
    }

checks=metrics(crop)
# Also inspect the visual core rather than letting a deliberately calm cinematic wall/floor
# dominate the whole-frame statistic. This makes the guard stricter where the character lives.
w,h=crop.size
core=crop.crop((int(w*.16),int(h*.08),int(w*.84),int(h*.88)))
core_checks=metrics(core,(120,80))
out={**checks,'core':core_checks}
print(json.dumps(out,indent=2))

# Known broken builds were neutral-gray or genuinely low-information. A warm cinematic
# background can legitimately occupy ~30% of the frame, so global dominance alone is not
# evidence of failure; require corroborating lack of variance/entropy or extreme dominance.
if checks['grayish_fraction']>0.35:
    raise SystemExit('FAIL: intended character viewport is dominated by neutral gray')
if checks['dominant_bucket_fraction']>0.42:
    raise SystemExit('FAIL: intended character viewport is overwhelmingly one flat color')
if checks['dominant_bucket_fraction']>0.30 and (checks['mean_channel_stddev']<26 or checks['quantized_entropy_bits']<4.2):
    raise SystemExit('FAIL: flat-color dominance is paired with insufficient visual information')
if checks['mean_channel_stddev']<25 or checks['quantized_entropy_bits']<3.5:
    raise SystemExit('FAIL: visual viewport lacks expected variance')
if core_checks['mean_channel_stddev']<20 or core_checks['quantized_entropy_bits']<3.25:
    raise SystemExit('FAIL: character/composition core lacks expected visual detail')
if core_checks['dominant_bucket_fraction']>0.48:
    raise SystemExit('FAIL: character/composition core is dominated by one flat color')

with open('forge/evidence/visual-pixel-gate.json','w',encoding='utf-8') as f:
    json.dump({'ok':True,**out},f,indent=2)
print('visual-pixel-gate PASS')