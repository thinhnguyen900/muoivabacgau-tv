const BASE='https://bacgau-character-v11-pass2.vercel.app/api/body';
const PATCHES=[
  // Fix a real geometry bug: CylinderGeometry is Y-axis by default; 90deg made philtrum horizontal.
  ['philtrum.rotation.z=Math.PI/2;','philtrum.rotation.z=0;'],
  // Reduce heavy brow/socket mass around the eyes.
  ['const browBridge=S(.67,.25,.34,fur,.985);','const browBridge=S(.61,.21,.30,fur,.99);'],
  ['const socket=S(.195,.152,.066,mid,.99);','const socket=S(.180,.138,.060,mid,.99);'],
  ['const temple=S(.40,.49,.34,mid,.985);','const temple=S(.38,.46,.31,mid,.99);'],
  ['const ear=S(.29,.31,.20,fur,.985);','const ear=S(.275,.292,.19,fur,.99);'],
  // Softer overall silhouette: slightly less barrel-shaped torso and shoulder blocks.
  ['const body=S(1.11,1.40,.88,fur,.97);','const body=S(1.07,1.36,.86,fur,.98);'],
  ['const hip=S(.98,.82,.80,mid,.985);','const hip=S(.94,.79,.77,mid,.99);'],
  ['const belly=S(.70,.86,.54,mid,.985);','const belly=S(.68,.82,.52,mid,.99);'],
  ['const neck=S(.76,.51,.64,fur,.985);','const neck=S(.70,.46,.60,fur,.99);'],
  ['const sh=S(.45,.40,.46,fur,.985);','const sh=S(.41,.37,.42,fur,.99);'],
  // Arms transition more smoothly from shoulder -> forearm -> paw.
  ['const up=S(.27,.58,.30,fur,.985);','const up=S(.285,.55,.295,fur,.99);'],
  ['const fore=S(.255,.50,.275,mid,.99);','const fore=S(.27,.47,.27,mid,.99);'],
  ['const paw=S(.32,.27,.33,light,.99);','const paw=S(.315,.255,.32,light,.99);'],
  // Integrate smile slightly closer to muzzle surface.
  ['mouth.position.set(0,-.42,.902);','mouth.position.set(0,-.415,.892);'],
  ["visualVersion:'v11-character-pass2'","visualVersion:'v11-character-pass3'"]
];
module.exports=async function handler(req,res){
  try{
    const r=await fetch(BASE,{headers:{'User-Agent':'bacgau-character-v11-pass3'}});
    if(!r.ok)return res.status(502).send('pass2 fetch failed');
    let html=await r.text();
    let applied=0;const missing=[];
    for(const [from,to] of PATCHES){if(html.includes(from)){html=html.split(from).join(to);applied++;}else missing.push(from.slice(0,72));}
    html=html.replace('content="v11-character-pass2"','content="v11-character-pass3"');
    html=html.replace('Character refinement · pass 2','Character refinement · pass 3');
    html=html.replace('</body>',`<script>window.__BACGAU_CHARACTER_PASS3__={version:'v11-character-pass3',applied:${applied},expected:${PATCHES.length},missing:${JSON.stringify(missing)}};<\/script></body>`);
    res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
    res.setHeader('X-BacGau-Character','v11-character-pass3');res.setHeader('X-BacGau-Pass3',`${applied}/${PATCHES.length}`);
    return res.status(200).send(html);
  }catch(e){return res.status(500).send('pass3 error: '+e.message)}
};
