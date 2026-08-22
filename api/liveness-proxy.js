const PIN='f38df09002d9e8d1bf4fc522aa365474a4b73628';
const URL=`https://cdn.jsdelivr.net/gh/thinhnguyen900/muoivabacgau-tv@${PIN}/forge/liveness.js`;
module.exports=async function handler(req,res){
  try{
    const r=await fetch(URL,{headers:{'User-Agent':'bacgau-liveness-proxy'}});
    if(!r.ok)return res.status(502).send(`liveness upstream ${r.status}`);
    const js=await r.text();
    res.setHeader('Content-Type','application/javascript; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400, immutable');
    res.setHeader('X-BacGau-Vendor','liveness');
    return res.status(200).send(js);
  }catch(e){return res.status(500).send(`liveness proxy: ${e.message}`)}
};
