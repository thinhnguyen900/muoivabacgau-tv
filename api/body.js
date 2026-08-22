const PIN='f38df09002d9e8d1bf4fc522aa365474a4b73628';
const ROOT=`https://cdn.jsdelivr.net/gh/thinhnguyen900/muoivabacgau-tv@${PIN}/forge/`;

const FACE_PATCHES=[
  // Softer head silhouette: a touch wider, slightly less tall/deep.
  ['const head=S(1.08,1.06,.93,fur,.965);','const head=S(1.11,1.035,.91,fur,.975);'],
  ['const crown=S(.82,.47,.64,mid,.98);','const crown=S(.84,.445,.62,mid,.985);'],
  // Cheeks and muzzle: smaller projection, rounder integrated face.
  ['const cheek=S(.42,.38,.33,light,.985);','const cheek=S(.43,.365,.305,light,.99);'],
  ['const muzzleBridge=S(.25,.21,.16,muz,.985);','const muzzleBridge=S(.235,.19,.145,muz,.99);'],
  ['const muzzleBase=S(.43,.29,.27,muz,.985);','const muzzleBase=S(.405,.265,.245,muz,.99);'],
  ['const pad=S(.23,.18,.19,0xbc967b,.985);','const pad=S(.215,.165,.17,0xbc967b,.99);'],
  ['const jaw=S(.27,.12,.18,0xaa826a,.985);','const jaw=S(.245,.105,.155,0xaa826a,.99);'],
  ['const nose=S(.14,.09,.085,dark,.62);','const nose=S(.132,.082,.074,dark,.68);'],
  // Eyes: less exposed white, larger warm iris relative to sclera, smaller catchlights.
  ['const white=S(.128,.102,.050,scl,.64);','const white=S(.116,.091,.046,scl,.72);'],
  ['const ir=S(.098,.090,.031,iris,.48);','const ir=S(.094,.086,.030,iris,.52);'],
  ['const pu=S(.050,.057,.018,pupil,.32);','const pu=S(.046,.052,.017,pupil,.36);'],
  ['const gl=new THREE.Mesh(new THREE.SphereGeometry(.014,12,8)','const gl=new THREE.Mesh(new THREE.SphereGeometry(.0105,12,8)'],
  ['const gl2=new THREE.Mesh(new THREE.SphereGeometry(.006,10,6)','const gl2=new THREE.Mesh(new THREE.SphereGeometry(.0045,10,6)'],
  // Eyelids sit closer to the eye for a calmer resting expression.
  ['upper.position.set(x,.414,.831);','upper.position.set(x,.398,.831);'],
  ['lower.position.set(x,.183,.822);','lower.position.set(x,.198,.822);'],
  // Brows and smile: thinner and less graphic.
  ['const browL=S(.165,.015,.020,browMat,.92);','const browL=S(.155,.011,.017,browMat,.96);'],
  ['const mouth=new THREE.Mesh(new THREE.TorusGeometry(.116,.009,10,32,Math.PI)','const mouth=new THREE.Mesh(new THREE.TorusGeometry(.108,.0065,10,32,Math.PI)'],
  // Softer facial motion; avoid eyebrow/arm caricature.
  ["u.upperLidL.position.y=.414-.128*cl;u.upperLidR.position.y=.414-.120*Math.max(0,cl-asym);u.lowerLidL.position.y=.183+.086*cl;u.lowerLidR.position.y=.183+.081*Math.max(0,cl-asym);","u.upperLidL.position.y=.398-.106*cl;u.upperLidR.position.y=.398-.101*Math.max(0,cl-asym);u.lowerLidL.position.y=.198+.070*cl;u.lowerLidR.position.y=.198+.066*Math.max(0,cl-asym);"],
  ["u.browL.position.y=.53;u.browR.position.y=.53;u.browL.rotation.z=.055;u.browR.rotation.z=-.055;","u.browL.position.y=.525;u.browR.position.y=.525;u.browL.rotation.z=.040;u.browR.rotation.z=-.040;"],
  ["u.headRig.rotation.z=.006*Math.sin(t*.68);u.headRig.rotation.y=.009*Math.sin(t*.43);","u.headRig.rotation.z=.0045*Math.sin(t*.61);u.headRig.rotation.y=.0065*Math.sin(t*.39);"],
  // Character pass marker for automated checks.
  ["visualVersion:'v9-soft-face-sheen'","visualVersion:'v11-soft-face-pass1'"]
];

module.exports = async function handler(req,res){
  try{
    const r=await fetch(ROOT+'review-gate.html',{headers:{'User-Agent':'bacgau-character-v11'}});
    if(!r.ok) return res.status(502).send('3D body fetch failed');
    let html=await r.text();
    const replacements=[
      ['./brain.js',ROOT+'brain.js'],
      ['./liveness.js',ROOT+'liveness.js'],
      ['./turn-runtime.js',ROOT+'turn-runtime.js'],
      ['./three.module.js',ROOT+'three.module.js'],
      ['./three.core.js',ROOT+'three.core.js'],
      ['./assets/',ROOT+'assets/']
    ];
    for(const [from,to] of replacements) html=html.split(from).join(to);

    let applied=0;
    for(const [from,to] of FACE_PATCHES){
      if(html.includes(from)){html=html.split(from).join(to);applied++;}
    }
    html=html.replace('</head>','<base target="_self"><meta name="bacgau-character-pass" content="v11-face-pass1"></head>');
    html=html.replace('BODY ↔ BRAIN · Living character v9','Bác Gấu · Character v11');
    html=html.replace('Warm cinematic character study · live WebGL','Character refinement · face pass 1');
    html=html.replace('</body>',`<script>window.__BACGAU_CHARACTER_PATCH__={version:'v11-face-pass1',applied:${applied},expected:${FACE_PATCHES.length}};<\/script></body>`);

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-BacGau-Character','v11-face-pass1');
    res.setHeader('X-BacGau-Patches',`${applied}/${FACE_PATCHES.length}`);
    return res.status(200).send(html);
  }catch(e){
    return res.status(500).send('3D body bridge error');
  }
};
