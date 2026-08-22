const BASE='https://bacgau-character-v11-pass7-flat-12xv9av92.vercel.app/api/body';

module.exports=async function handler(req,res){
  try{
    const r=await fetch(BASE,{headers:{'User-Agent':'bacgau-pass8-safari','Cache-Control':'no-cache'}});
    if(!r.ok)return res.status(502).send(`pass7 base ${r.status}`);
    let html=await r.text();

    // Safari/iOS stability: browser loads executable JS from this same Vercel origin.
    html=html
      .replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/thinhnguyen900\/muoivabacgau-tv@f38df09002d9e8d1bf4fc522aa365474a4b73628\/forge\/three\.module\.js/g,'/api/three')
      .replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/thinhnguyen900\/muoivabacgau-tv@f38df09002d9e8d1bf4fc522aa365474a4b73628\/forge\/brain\.js/g,'/api/brain-proxy')
      .replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/thinhnguyen900\/muoivabacgau-tv@f38df09002d9e8d1bf4fc522aa365474a4b73628\/forge\/liveness\.js/g,'/api/liveness-proxy');

    // Visible diagnostic instead of a silent black stage on Safari.
    const watchdog=`<script>(function(){
      window.__BACGAU_BOOT_STARTED__=Date.now();
      const stage=document.getElementById('stage'),bubble=document.getElementById('bubble');
      function fail(code,detail){
        document.documentElement.dataset.bacgauBoot=code;
        if(stage)stage.style.background='radial-gradient(circle at 50% 35%,#30231d,#120e0b 72%)';
        if(bubble)bubble.textContent='Bác Gấu chưa khởi tạo được 3D · '+code+(detail?' · '+String(detail).slice(0,80):'');
        window.__BACGAU_BOOT_ERROR__={code,detail:String(detail||''),ua:navigator.userAgent};
      }
      window.addEventListener('error',e=>fail('JS',e.message));
      window.addEventListener('unhandledrejection',e=>fail('PROMISE',e.reason&&e.reason.message||e.reason));
      setTimeout(()=>{if(!window.__BACGAU_READY__)fail('3D_TIMEOUT','WebGL/module did not reach ready state')},6500);
      try{
        const c=document.createElement('canvas');
        const gl=c.getContext('webgl2')||c.getContext('webgl');
        window.__BACGAU_WEBGL_CAP__={available:!!gl,renderer:gl?String(gl.getParameter(gl.RENDERER)||''):''};
        if(!gl)fail('NO_WEBGL','Safari returned no WebGL context');
      }catch(e){fail('WEBGL_INIT',e.message)}
    })();<\/script>`;
    html=html.replace('<script type="module">',watchdog+'<script type="module">');
    html=html.replace(/v11-character-pass7-flat/g,'v11-character-pass8-safari');
    html=html.replace('Character refinement · pass 7 · flat endpoint','Character refinement · pass 8 · Safari module fix');
    html=html.replace('</body>',`<script>window.__BACGAU_PASS8__={sameOriginModules:true,watchdog:true,base:'immutable-pass7'};<\/script></body>`);

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-BacGau-Character','v11-character-pass8-safari');
    res.setHeader('X-BacGau-Same-Origin-Modules','1');
    return res.status(200).send(html);
  }catch(e){return res.status(500).send('pass8 body error: '+e.message)}
};
