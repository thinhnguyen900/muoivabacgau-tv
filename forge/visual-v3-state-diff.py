from PIL import Image, ImageChops, ImageStat
import json, itertools, os

states=['welcoming','gentle','thinking','playful']
imgs={s:Image.open(f'forge/evidence/visual-v3-{s}.png').convert('RGB') for s in states}
results=[]
for a,b in itertools.combinations(states,2):
    ia,ib=imgs[a],imgs[b]
    if ia.size!=ib.size:
        raise SystemExit(f'size mismatch {a} {b}: {ia.size} vs {ib.size}')
    diff=ImageChops.difference(ia,ib)
    stat=ImageStat.Stat(diff)
    rms=(sum(v*v for v in stat.rms)/len(stat.rms))**0.5
    mean=sum(stat.mean)/len(stat.mean)
    bbox=diff.getbbox()
    results.append({'a':a,'b':b,'rms':rms,'mean_abs':mean,'bbox':bbox})

# Motion alone can create tiny pixel deltas. Require every pair to have a material whole-frame difference.
weak=[r for r in results if r['rms'] < 2.2 or r['mean_abs'] < 0.55 or not r['bbox']]
out={'ok':not weak,'thresholds':{'rms_min':2.2,'mean_abs_min':0.55},'pairs':results,'weak_pairs':weak}
os.makedirs('forge/evidence',exist_ok=True)
with open('forge/evidence/visual-v3-state-diff.json','w',encoding='utf-8') as f: json.dump(out,f,ensure_ascii=False,indent=2)
if weak:
    raise SystemExit('Emotion states are not visually distinct enough: '+json.dumps(weak,ensure_ascii=False))
print('visual-v3-state-diff PASS',json.dumps(results,ensure_ascii=False))
