export type PlayerSource =
  | { type: 'youtube'; id: string }
  | { type: 'vimeo'; id: string }
  | { type: 'page'; uri: string };

export type VideoEmbedProps = {
  source: PlayerSource;
  cinema?: boolean;
  onCinemaChange?: (on: boolean) => void;
  onEnded?: () => void;
};

export function formatTimecode(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function safeMediaId(id: string) {
  return /^[\w-]{1,32}$/.test(id) ? id : '';
}

/** Hide YouTube title/logo by cropping the iframe; stream still comes from YT. */
export function cropYouTubeIframe(iframe: HTMLIFrameElement) {
  iframe.style.position = 'absolute';
  iframe.style.top = '-10%';
  iframe.style.left = '-1%';
  iframe.style.width = '102%';
  iframe.style.height = '120%';
  iframe.style.border = '0';
  iframe.style.pointerEvents = 'none';
}

/** Custom chrome (controls=0). modestbranding / rel / iv_load_policy as specified. mute=1 so autoplay starts from the card tap. */
export const YOUTUBE_PLAYER_VARS = {
  autoplay: 1,
  mute: 1,
  controls: 0,
  disablekb: 1,
  fs: 0,
  modestbranding: 1,
  playsinline: 1,
  rel: 0,
  iv_load_policy: 3,
  cc_load_policy: 0,
  hl: 'ru',
  cc_lang_pref: 'ru',
  enablejsapi: 1,
} as const;

export const END_GUARD_SEC = 1.2;

/** In-app HTML player for native: no YouTube play overlay, auto-close on end, cinema mode. */
export function playerHtml(source: Extract<PlayerSource, { type: 'youtube' | 'vimeo' }>) {
  const id = safeMediaId(source.id);
  const kind = source.type;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#000;color:#F8FAFC;font-family:-apple-system,system-ui,sans-serif;overflow:hidden}
  #wrap{display:flex;flex-direction:column;height:100%}
  #stage{flex:1;position:relative;background:#000;min-height:0;overflow:hidden}
  #host{position:absolute;inset:0;overflow:hidden;background:#000}
  #stage iframe{position:absolute;top:-10%;left:-1%;width:102%;height:120%;border:0;pointer-events:none;background:#000}
  #cover,#endveil{position:absolute;inset:0;z-index:6;background:#000}
  #endveil{display:none;z-index:8}
  #hit{position:absolute;inset:0;z-index:3}
  #exit{display:none;position:absolute;top:16px;right:16px;z-index:9;border:1px solid #1E293B;background:#131722;color:#F8FAFC;border-radius:12px;padding:8px 12px;font-weight:800}
  body.cinema #bar{display:none}
  body.cinema #exit.shown{display:block}
  #bar{background:#131722;border-top:1px solid #1E293B;padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}
  #seek{width:100%;height:6px;border-radius:99px;outline:none;accent-color:#10B981;background:#0F141F}
  #row{display:flex;align-items:center;gap:12px}
  #play,#fs{width:44px;height:44px;border-radius:12px;border:1px solid #1E293B;background:#181D2A;color:#F8FAFC;font-size:16px}
  #time{color:#94A3B8;font-weight:700;font-size:13px}
  #brand{margin-left:auto;color:#8B5CF6;font-weight:800;font-size:11px;letter-spacing:.8px;text-transform:uppercase}
  #msg{position:absolute;inset:0;z-index:7;display:none;align-items:center;justify-content:center;padding:24px;text-align:center;color:#94A3B8;background:#000}
</style>
</head>
<body>
<div id="wrap">
  <div id="stage">
    <div id="host"></div>
    <div id="hit"></div>
    <div id="cover"></div>
    <div id="endveil"></div>
    <button id="exit" type="button">Свернуть</button>
    <div id="msg"></div>
  </div>
  <div id="bar">
    <input id="seek" type="range" min="0" max="0" step="0.1" value="0"/>
    <div id="row">
      <button id="play" type="button">❚❚</button>
      <span id="time">0:00 / 0:00</span>
      <span id="brand">Life Engine</span>
      <button id="fs" type="button">⛶</button>
    </div>
  </div>
</div>
<script>
(function(){
  var KIND=${JSON.stringify(kind)};
  var ID=${JSON.stringify(id)};
  var playing=false, duration=0, ready=false, seeking=false, started=false, closed=false, cinema=false, hintTimer=null;
  var playBtn=document.getElementById('play');
  var timeEl=document.getElementById('time');
  var seek=document.getElementById('seek');
  var cover=document.getElementById('cover');
  var veil=document.getElementById('endveil');
  var exit=document.getElementById('exit');
  var msg=document.getElementById('msg');
  var api=null;
  window.open=function(){return null};

  function notify(type){
    var payload=JSON.stringify({type:type});
    try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload); }catch(e){}
  }
  function pad(n){return (n<10?'0':'')+n}
  function fmt(sec){
    if(!isFinite(sec)||sec<0) sec=0;
    sec=Math.floor(sec);
    var h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60;
    return h>0? h+':'+pad(m)+':'+pad(s) : m+':'+pad(s);
  }
  function ui(){
    playBtn.textContent=playing?'❚❚':'▶';
    cover.style.display=started?'none':'block';
    timeEl.textContent=fmt(Number(seek.value))+' / '+fmt(duration);
  }
  function fail(text){
    msg.style.display='flex';
    msg.textContent=text;
  }
  function setTime(cur,dur){
    if(dur&&isFinite(dur)) duration=dur;
    seek.max=String(duration||0);
    if(!seeking) seek.value=String(cur||0);
    if(!closed && duration>0 && duration-cur<=1.2) finish();
    ui();
  }
  function finish(){
    if(closed) return;
    closed=true;
    veil.style.display='block';
    try{ if(api) api.pause(); }catch(e){}
    notify('ended');
  }
  function setCinema(on){
    cinema=!!on;
    document.body.classList.toggle('cinema', cinema);
    if(!cinema){ exit.classList.remove('shown'); }
    notify(cinema?'cinema':'chrome');
  }
  function showExit(){
    if(!cinema) return;
    exit.classList.add('shown');
    clearTimeout(hintTimer);
    hintTimer=setTimeout(function(){ exit.classList.remove('shown'); },2500);
  }

  document.getElementById('hit').onclick=function(){
    if(cinema) showExit();
    else if(ready&&api&&started) toggle();
  };
  playBtn.onclick=function(){ toggle(); };
  document.getElementById('fs').onclick=function(){ setCinema(true); };
  exit.onclick=function(){ setCinema(false); };
  seek.onmousedown=seek.ontouchstart=function(){ seeking=true; };
  seek.onmouseup=seek.ontouchend=function(){ seeking=false; jump(Number(seek.value)); };
  seek.oninput=function(){ timeEl.textContent=fmt(Number(seek.value))+' / '+fmt(duration); };
  window.__leSetCinema=setCinema;

  function toggle(){
    if(!ready||!api||closed) return;
    if(playing) api.pause(); else api.play();
  }
  function jump(sec){
    if(!ready||!api||closed) return;
    api.seek(sec);
  }

  if(!ID){ fail('Нет ролика для этой серии.'); return; }

  if(KIND==='youtube'){
    var tag=document.createElement('script');
    tag.src='https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady=function(){
      var yt=new YT.Player('host',{
        videoId:ID,
        playerVars:{
          autoplay:1, mute:1, controls:0, disablekb:1, fs:0, modestbranding:1,
          playsinline:1, rel:0, iv_load_policy:3, cc_load_policy:0,
          hl:'ru', cc_lang_pref:'ru', enablejsapi:1, origin:location.origin
        },
        events:{
          onReady:function(){
            ready=true;
            api={
              play:function(){ yt.playVideo(); },
              pause:function(){ yt.pauseVideo(); },
              seek:function(s){ yt.seekTo(s,true); }
            };
            try{ duration=yt.getDuration()||0; }catch(e){}
            try{ yt.mute(); }catch(e){}
            yt.playVideo();
            setInterval(function(){
              try{ setTime(yt.getCurrentTime(), yt.getDuration()); }catch(e){}
            },200);
          },
          onStateChange:function(e){
            playing=e.data===YT.PlayerState.PLAYING;
            if(playing){
              started=true;
              try{ yt.unMute(); }catch(err){}
            }
            if(e.data===YT.PlayerState.ENDED) finish();
            ui();
          },
          onError:function(){ fail('Этот ролик нельзя открыть во встроенном плеере.'); }
        }
      });
    };
  } else {
    var iframe=document.createElement('iframe');
    iframe.src='https://player.vimeo.com/video/'+ID+'?autoplay=1&muted=1&controls=0&title=0&byline=0&portrait=0&dnt=1';
    iframe.allow='autoplay; encrypted-media; picture-in-picture';
    iframe.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none';
    document.getElementById('host').appendChild(iframe);
    var vs=document.createElement('script');
    vs.src='https://player.vimeo.com/api/player.js';
    vs.onload=function(){
      var vm=new Vimeo.Player(iframe);
      ready=true;
      api={
        play:function(){ vm.play(); },
        pause:function(){ vm.pause(); },
        seek:function(s){ vm.setCurrentTime(s); }
      };
      vm.on('play',function(){ playing=true; started=true; vm.setVolume(1); ui(); });
      vm.on('pause',function(){ playing=false; ui(); });
      vm.on('ended',function(){ finish(); });
      vm.getDuration().then(function(d){ duration=d||0; ui(); });
      setInterval(function(){
        vm.getCurrentTime().then(function(t){
          vm.getDuration().then(function(d){ setTime(t,d); });
        });
      },200);
      vm.setVolume(0).then(function(){ return vm.play(); }).catch(function(){});
    };
    document.head.appendChild(vs);
  }
  ui();
})();
</script>
</body>
</html>`;
}
