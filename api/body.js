const PIN='f38df09002d9e8d1bf4fc522aa365474a4b73628';
const ROOT=`https://cdn.jsdelivr.net/gh/thinhnguyen900/muoivabacgau-tv@${PIN}/forge/`;

module.exports = async function handler(req,res){
  try{
    const r=await fetch(ROOT+'review-gate.html',{headers:{'User-Agent':'bacgau-recovery'}});
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
    html=html.replace('</head>','<base target="_self"></head>');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(html);
  }catch(e){
    return res.status(500).send('3D body bridge error');
  }
};
