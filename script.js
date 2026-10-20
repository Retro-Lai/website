/* retro-ui template — helpers (mobile nav, live clock) + 90s window manager */
(function(){

  // ---------- live clocks (menu bar + taskbar) ----------
  function timeStr(){
    var d=new Date(),h=d.getHours(),m=d.getMinutes();
    var ap=h>=12?'PM':'AM';h=h%12||12;
    return (h<10?'0':'')+h+':'+(m<10?'0':'')+m+' '+ap;
  }
  function tick(){
    var els=document.querySelectorAll('#clock,.tb-clock');
    for(var i=0;i<els.length;i++)els[i].textContent=timeStr();
  }


  /* =====================================================
     WINDOW MANAGER
     Every .win gets working buttons:
       _  minimise to the taskbar (click its taskbar button to restore)
       □  project cards only: open that project's page (or double-click the title bar)
       ×  close (reopen from Start ▸ Closed windows)
     Every window can be dragged by its title bar
     (Start ▸ Snap windows back puts them home).
     ===================================================== */
  /* ---------- SOUND (off by default — Start ▸ Sound) ---------- */
  var sfxOn=false,actx=null;
  try{sfxOn=localStorage.getItem('fx-sound')==='on';}catch(e){}
  function ensureCtx(){
    if(!actx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;actx=new AC();}
    if(actx.state==='suspended')actx.resume();
    return actx;
  }
  // one little chiptune "beep": start freq, length, wave, volume, end freq, delay
  function tone(f,d,type,vol,f2,delay){
    if(!sfxOn)return;
    var c=ensureCtx();if(!c)return;
    var t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();
    o.type=type||'square';o.frequency.setValueAtTime(f,t);
    if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
    g.gain.setValueAtTime(vol||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.02);
  }
  var sfx={
    click:function(){tone(880,.05,'square',.035);},
    open:function(){tone(440,.08,'square',.045,880);},
    close:function(){tone(660,.09,'square',.045,220);},
    menu:function(){tone(523,.06,'square',.035);tone(784,.08,'square',.035,null,.06);},
    jump:function(){tone(300,.12,'square',.045,700);},
    point:function(){tone(988,.06,'square',.035);tone(1319,.1,'square',.035,null,.07);},
    over:function(){tone(400,.45,'sawtooth',.05,70);},
    chime:function(){[523,659,784,1047].forEach(function(f,i){tone(f,.16,'triangle',.07,null,i*.09);});}
  };

  /* ---------- GAME WINDOW (Start ▸ Reel Runner) ---------- */
  var gameWin=document.createElement('div');
  gameWin.className='win gamewin is-closed';
  gameWin.setAttribute('data-app','game');
  gameWin.innerHTML=
    '<div class="bar orange"><span class="dots"><span class="y"></span><span class="m"></span><span class="c"></span></span><span class="ttl">reel-runner.exe</span></div>'+
    '<div class="body"><canvas width="640" height="200" aria-label="Reel Runner game: press space or tap to jump"></canvas>'+
    '<p class="gamehelp">SPACE / ↑ / tap to jump · dodge the tripods &amp; film reels</p></div>';
  document.body.appendChild(gameWin);

  /* ---------- JUKEBOX WINDOW (Start ▸ Jukebox) ---------- */
  var jukeWin=document.createElement('div');
  jukeWin.className='win jukewin is-closed';
  jukeWin.setAttribute('data-app','jukebox');
  jukeWin.innerHTML=
    '<div class="bar blue"><span class="dots"><span class="y"></span><span class="m"></span><span class="c"></span></span><span class="ttl">jukebox.exe</span></div>'+
    '<div class="body">'+
      '<div class="jb-screen">'+
        '<canvas class="jb-viz" width="320" height="64" aria-hidden="true"></canvas>'+
        '<div class="jb-marquee"><span>♪ insert coin ♪</span></div>'+
        '<div class="jb-time"><span class="jb-state">■ STOP</span><span><span class="jb-cur">0:00</span> / <span class="jb-dur">0:00</span></span></div>'+
      '</div>'+
      '<div class="jb-seek" title="Click to jump"><b></b></div>'+
      '<div class="jb-ctrls">'+
        '<button type="button" data-jb="prev" title="Previous">⏮</button>'+
        '<button type="button" data-jb="play" title="Play / pause" class="jb-play">▶</button>'+
        '<button type="button" data-jb="stop" title="Stop">■</button>'+
        '<button type="button" data-jb="next" title="Next">⏭</button>'+
        '<label class="jb-vol" title="Volume">🔈<input type="range" min="0" max="100" value="70" aria-label="Volume"></label>'+
      '</div>'+
      '<ol class="jb-list"></ol>'+
      '<label class="jb-load">📂 Play a .mid from your computer<input type="file" accept=".mid,.midi,audio/midi,audio/x-midi" hidden></label>'+
    '</div>';
  document.body.appendChild(jukeWin);

  var wins=[].slice.call(document.querySelectorAll('.win'));
  var topZ=10;

  // --- taskbar + start menu ---
  var bar=document.createElement('div');
  bar.className='taskbar';
  bar.innerHTML=
    '<button class="tb-start" aria-haspopup="true" aria-expanded="false"><span class="tb-logo"></span>Start</button>'+
    '<div class="tb-tasks" aria-label="Minimised windows"></div>'+
    '<span class="tb-clock">--:--</span>'+
    '<div class="startmenu" hidden>'+
      '<div class="sm-side">FORRESTER<b>95</b></div>'+
      '<div class="sm-items">'+
        '<a href="index.html">🏠 Home</a>'+
        '<a href="about.html">☺ About</a>'+
        '<a href="work.html">▶ Work</a>'+
        '<a href="gallery.html">◉ Gallery</a>'+
        '<a href="links.html">✦ Links</a>'+
        '<a href="contact.html">✉ Contact</a>'+
        '<hr>'+
        '<button class="sm-game">🎮 Reel Runner</button>'+
        '<button class="sm-juke">📻 Jukebox</button>'+
        '<button class="sm-buddy">☺ Rec the helper</button>'+
        '<button class="sm-sound"></button>'+
        '<hr>'+
        '<div class="sm-closed-wrap"><div class="sm-label">Closed windows</div><div class="sm-closed"></div></div>'+
        '<button class="sm-restore">↺ Restore all windows</button>'+
        '<button class="sm-tidy">⊞ Snap windows back</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(bar);
  document.body.classList.add('has-taskbar');
  var tasks=bar.querySelector('.tb-tasks'),
      startBtn=bar.querySelector('.tb-start'),
      menu=bar.querySelector('.startmenu'),
      closedList=bar.querySelector('.sm-closed'),
      closedWrap=bar.querySelector('.sm-closed-wrap');
  tick();setInterval(tick,15000);

  function setMenu(open){
    menu.hidden=!open;
    startBtn.classList.toggle('on',open);
    startBtn.setAttribute('aria-expanded',open?'true':'false');
    if(open){renderClosed();sfx.menu();}
  }
  startBtn.addEventListener('click',function(e){e.stopPropagation();setMenu(menu.hidden);});
  menu.addEventListener('click',function(e){e.stopPropagation();});
  document.addEventListener('click',function(){setMenu(false);});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      setMenu(false);
      var m=document.querySelector('.win.maxed');if(m)toggleMax(m);
    }
  });

  function titleOf(w){
    var t=w.querySelector('.bar .ttl');
    return t?t.textContent.trim():'window';
  }
  function focusWin(w){
    if(!w.hasAttribute('data-app')){topZ++;w.style.zIndex=topZ;}
    wins.forEach(function(o){o.classList.toggle('active',o===w);});
  }

  // --- close ---
  function closeWin(w){
    sfx.close();
    if(w._onclose)w._onclose();
    if(w.classList.contains('maxed'))toggleMax(w);
    w.classList.add('anim-close');
    setTimeout(function(){
      w.classList.remove('anim-close');
      w.classList.add('is-closed');
      removeTask(w);
    },180);
  }
  function openWin(w){
    sfx.open();
    w.classList.remove('is-closed','is-min');
    removeTask(w);
    w.classList.add('anim-open');
    setTimeout(function(){w.classList.remove('anim-open');},220);
    focusWin(w);
  }
  function renderClosed(){
    closedList.innerHTML='';
    var closed=wins.filter(function(w){return w.classList.contains('is-closed')&&!w.hasAttribute('data-app');});
    closedWrap.style.display=closed.length?'':'none';
    closed.forEach(function(w){
      var b=document.createElement('button');
      b.textContent='🗔 '+titleOf(w);
      b.addEventListener('click',function(){openWin(w);setMenu(false);});
      closedList.appendChild(b);
    });
  }
  bar.querySelector('.sm-restore').addEventListener('click',function(){
    wins.forEach(function(w){
      if(w.hasAttribute('data-app')&&w.classList.contains('is-closed'))return;
      if(w.classList.contains('is-closed')||w.classList.contains('is-min'))openWin(w);
    });
    setMenu(false);
  });

  // --- Start ▸ Sound toggle ---
  var soundBtn=bar.querySelector('.sm-sound');
  function paintSound(){
    soundBtn.textContent=sfxOn?'🔊 Sound: On':'🔇 Sound: Off';
    soundBtn.setAttribute('aria-pressed',sfxOn?'true':'false');
  }
  paintSound();
  soundBtn.addEventListener('click',function(){
    sfxOn=!sfxOn;
    try{localStorage.setItem('fx-sound',sfxOn?'on':'off');}catch(e){}
    paintSound();
    if(sfxOn)sfx.chime();
  });
  // clicks on buttons and links get a tiny blip
  document.addEventListener('click',function(e){
    if(e.target.closest('.btn,.nav a,.sm-items a,.tb-task,a.thumb,.soc a'))sfx.click();
  },true);

  // --- Start ▸ Reel Runner ---
  bar.querySelector('.sm-game').addEventListener('click',function(){
    setMenu(false);
    if(document.activeElement)document.activeElement.blur();
    if(gameWin.classList.contains('is-min')||gameWin.classList.contains('is-closed'))openWin(gameWin);
    else focusWin(gameWin);
    game.ready();
  });

  // --- Start ▸ Jukebox ---
  bar.querySelector('.sm-juke').addEventListener('click',function(){
    setMenu(false);
    if(jukeWin.classList.contains('is-min')||jukeWin.classList.contains('is-closed'))openWin(jukeWin);
    else focusWin(jukeWin);
    juke.open();
  });

  // --- minimise ---
  function minWin(w){
    sfx.close();
    if(w.classList.contains('maxed'))toggleMax(w);
    w.classList.add('anim-close');
    setTimeout(function(){
      w.classList.remove('anim-close');
      w.classList.add('is-min');
      addTask(w);
    },180);
  }
  function addTask(w){
    if(w._task)return;
    var b=document.createElement('button');
    b.className='tb-task';
    b.textContent=titleOf(w);
    b.title='Restore '+titleOf(w);
    b.addEventListener('click',function(){openWin(w);});
    tasks.appendChild(b);
    w._task=b;
  }
  function removeTask(w){
    if(w._task){w._task.remove();w._task=null;}
  }

  // --- maximise ---
  var shade=document.createElement('div');
  shade.className='win-shade';
  document.body.appendChild(shade);
  shade.addEventListener('click',function(){
    var m=document.querySelector('.win.maxed');if(m)toggleMax(m);
  });
  function toggleMax(w){
    var on=!w.classList.contains('maxed');
    var cur=document.querySelector('.win.maxed');
    if(cur&&cur!==w)toggleMax(cur);
    if(on){
      // leave a placeholder so the page layout doesn't jump
      var ph=document.createElement('div');
      ph.className='win-placeholder';
      ph.style.height=w.offsetHeight+'px';
      if(!w.closest('.cluster'))w.parentNode.insertBefore(ph,w);
      w._ph=ph;
      w.classList.add('maxed');
      document.body.classList.add('win-maxed');
    }else{
      w.classList.remove('maxed');
      if(w._ph){w._ph.remove();w._ph=null;}
      document.body.classList.remove('win-maxed');
    }
    var b=w.querySelector('[data-act="max"]');
    if(b){b.textContent=on?'❐':'□';b.title=on?'Restore':'Maximise';}
    focusWin(w);
  }

  // --- give every window the same three working buttons ---
  function setupCtrls(w){
    var b=w.querySelector('.bar');
    if(!b)return;
    var c=b.querySelector('.ctrls');
    if(!c){c=document.createElement('span');c.className='ctrls';b.appendChild(c);}
    c.innerHTML='';
    // only project cards (the ones with a play-button link) get a □ button,
    // and it opens that project's page
    var proj=w.querySelector('a.thumb');
    var acts=[['min','_','Minimise']];
    if(proj)acts.push(['open','□','Open project']);
    acts.push(['close','×','Close']);
    acts.forEach(function(a){
      var btn=document.createElement('button');
      btn.type='button';btn.setAttribute('data-act',a[0]);
      btn.textContent=a[1];btn.title=a[2];btn.setAttribute('aria-label',a[2]+' '+titleOf(w));
      c.appendChild(btn);
    });
    c.addEventListener('click',function(e){
      var act=e.target.getAttribute('data-act');
      if(!act)return;
      e.stopPropagation();
      if(act==='close')closeWin(w);
      else if(act==='min')minWin(w);
      else if(act==='open'&&proj)go(proj.href);
    });
    if(proj)b.addEventListener('dblclick',function(e){
      if(e.target.closest('.ctrls'))return;
      go(proj.href);
    });
    w.addEventListener('mousedown',function(){focusWin(w);});
  }

  // --- drag ANY window around by its title bar ---
  // Uses the CSS `translate` property so the page layout never jumps:
  // the window's original spot stays reserved while it floats elsewhere.
  function setupDrag(w){
    var b=w.querySelector('.bar');if(!b)return;
    w._dx=0;w._dy=0;
    b.classList.add('draggable');
    // stop the browser from starting a text selection when grabbing the title bar
    b.addEventListener('mousedown',function(e){if(!e.target.closest('.ctrls,a,button'))e.preventDefault();});
    b.addEventListener('pointerdown',function(e){
      if(e.button!==0||e.target.closest('.ctrls,a,button')||w.classList.contains('maxed'))return;
      e.preventDefault();
      focusWin(w);
      var sx=e.clientX,sy=e.clientY,ox=w._dx,oy=w._dy;
      var r=w.getBoundingClientRect();
      // the window's untranslated position, in page coordinates
      var baseL=r.left-ox, baseT=r.top+window.scrollY-oy;
      var fixed=getComputedStyle(w).position==='fixed';
      if(fixed)baseT=r.top-oy;   // floating windows use screen coordinates
      // lowest point a window may reach: its bottom edge stops at the top of the footer
      var foot=document.querySelector('.footer');
      var floorY=foot?foot.getBoundingClientRect().top+window.scrollY-8:Infinity;
      var maxDy=fixed?window.innerHeight-90-baseT:floorY-(baseT+r.height);
      var moved=false;
      b.setPointerCapture(e.pointerId);
      function move(ev){
        var dx=ox+ev.clientX-sx, dy=oy+ev.clientY-sy;
        if(!moved&&Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)<4)return;
        if(!moved){var sel=window.getSelection&&window.getSelection();if(sel)sel.removeAllRanges();}
        moved=true;w.classList.add('dragging');document.body.classList.add('is-dragging');
        // keep the whole window inside the page width, below the top of the page and above the footer
        var maxL=document.documentElement.clientWidth-r.width-6;
        dx=Math.max(6-baseL,Math.min(dx,maxL-baseL));
        dy=Math.min(Math.max(-baseT+60,dy),maxDy);
        w._dx=dx;w._dy=dy;
        w.style.translate=dx+'px '+dy+'px';
      }
      function up(){
        w.classList.remove('dragging');document.body.classList.remove('is-dragging');
        b.removeEventListener('pointermove',move);
        b.removeEventListener('pointerup',up);
        b.removeEventListener('pointercancel',up);
      }
      b.addEventListener('pointermove',move);
      b.addEventListener('pointerup',up);
      b.addEventListener('pointercancel',up);
    });
  }
  function setupWin(w){setupCtrls(w);setupDrag(w);}
  wins.forEach(setupWin);
  function tidyWins(){
    wins.forEach(function(w){w._dx=0;w._dy=0;w.style.translate='';});
  }
  bar.querySelector('.sm-tidy').addEventListener('click',function(){tidyWins();setMenu(false);});

  /* =====================================================
     REEL RUNNER — a tiny endless runner.
     The site's pixel smiley jumps over tripods and film reels.
     ===================================================== */
  var game=(function(){
    var cv=gameWin.querySelector('canvas'),cx=cv.getContext('2d');
    var W=640,H=200,GROUND=168,PX=3,PLAYER_X=56;
    var C={k:'#161020',y:'#ffe14d',o:'#ff8a2b',c:'#54e6d0',m:'#ff3df0',g:'#cfd3dc',x:'#0b0f17'};
    var FACE=["...kkkkkk...","..kyyyyyyk..",".kyyyyyyyyk.","kyyyyyyyyyyk","kyykyyyykyyk","kyykyyyykyyk",
              "kyyyyyyyyyyk","kykyyyyyykyk","kyykyyyykyyk",".kyykkkkyyk.","..kyyyyyyk..","...kkkkkk..."];
    var DEAD=["...kkkkkk...","..kyyyyyyk..",".kyyyyyyyyk.","kyyyyyyyyyyk","kykykyykykyk","kyykyyyykyyk",
              "kykykyykykyk","kyyyyyyyyyyk","kyyykkkkyyyk",".kykyyyykyk.","..kyyyyyyk..","...kkkkkk..."];
    var TRIPOD=["ooooooo..","ooooooocc","ooooooocc","ooooooo..","...gg....","...gg....",
                "..g..g...","..g..g...",".g....g..",".g....g..","g......g.","g......g."];
    var REEL=["..mmmmmm..",".mmmmmmmm.","mmxxmmxxmm","mmxxmmxxmm","mmmmxxmmmm",
              "mmmmxxmmmm","mmxxmmxxmm","mmxxmmxxmm",".mmmmmmmm.","..mmmmmm.."];
    var KINDS=[{s:TRIPOD,n:1},{s:REEL,n:1},{s:REEL,n:2}];
    var st,raf=0,acc=0,last=0,hi=0;
    try{hi=+localStorage.getItem('reel-runner-hi')||0;}catch(e){}

    function sprite(rows,x,y,scale){
      for(var r=0;r<rows.length;r++)for(var i=0;i<rows[r].length;i++){
        var ch=rows[r][i];if(ch==='.')continue;
        cx.fillStyle=C[ch];cx.fillRect(Math.round(x+i*scale),Math.round(y+r*scale),scale,scale);
      }
    }
    function fresh(mode){
      st={mode:mode,y:0,vy:0,obs:[],speed:5.5,dist:0,score:0,next:70,ground:0};
    }
    function pad(n){n=Math.floor(n);return ('00000'+n).slice(-5);}
    function draw(){
      cx.fillStyle=C.x;cx.fillRect(0,0,W,H);
      // faint grid that scrolls with the ground
      cx.fillStyle='rgba(255,255,255,.06)';
      var off=st.ground%32;
      for(var gx=-off;gx<W;gx+=32)cx.fillRect(Math.round(gx),0,1,GROUND);
      for(var gy=8;gy<GROUND;gy+=32)cx.fillRect(0,gy,W,1);
      // ground line + pebbles
      cx.fillStyle='#f3efff';cx.fillRect(0,GROUND,W,2);
      cx.fillStyle='rgba(243,239,255,.45)';
      for(var p=0;p<24;p++){var px=((p*97)-st.ground*1)%W;if(px<0)px+=W;cx.fillRect(px,GROUND+6+(p%3)*7,(p%2)+2,2);}
      // obstacles
      st.obs.forEach(function(o){for(var k=0;k<o.n;k++)sprite(o.s,o.x+k*(o.w/o.n),GROUND-o.h,PX);});
      // player
      sprite(st.mode==='over'?DEAD:FACE,PLAYER_X,GROUND-36-st.y,PX);
      // score
      cx.font='bold 14px "Space Mono",ui-monospace,monospace';cx.textAlign='right';
      cx.fillStyle='rgba(243,239,255,.55)';cx.fillText('HI '+pad(hi),W-92,24);
      cx.fillStyle='#f3efff';cx.fillText(pad(st.score),W-14,24);
      // messages
      cx.textAlign='center';
      if(st.mode==='ready'){banner('REEL RUNNER','press SPACE or tap to start');}
      if(st.mode==='paused'){banner('PAUSED','press SPACE or tap to continue');}
      if(st.mode==='over'){banner('GAME OVER','press SPACE or tap to try again');}
    }
    function banner(a,b){
      cx.fillStyle=C.y;cx.font='bold 26px "Space Mono",ui-monospace,monospace';cx.fillText(a,W/2,82);
      cx.fillStyle='#f3efff';cx.font='13px "Space Mono",ui-monospace,monospace';cx.fillText(b,W/2,108);
    }
    function spawn(){
      var k=KINDS[st.score>250?Math.floor(Math.random()*3):Math.floor(Math.random()*2)];
      var w=k.s[0].length*PX*k.n,h=k.s.length*PX;
      st.obs.push({s:k.s,n:k.n,x:W+10,w:w,h:h});
      var gap=Math.max(42,(Math.random()*55+60)-st.speed*2.2);
      st.next=gap;
    }
    function step(){
      st.speed=Math.min(13,5.5+st.dist/2200);
      st.dist+=st.speed;st.ground+=st.speed;
      var before=Math.floor(st.score/100);
      st.score=st.dist/12;
      if(Math.floor(st.score/100)>before)sfx.point();
      // jump physics
      if(st.y>0||st.vy>0){st.vy-=0.62;st.y+=st.vy;if(st.y<=0){st.y=0;st.vy=0;}}
      // obstacles
      if(--st.next<=0)spawn();
      st.obs.forEach(function(o){o.x-=st.speed;});
      st.obs=st.obs.filter(function(o){return o.x+o.w>-10;});
      // collision (slightly forgiving boxes)
      var pT=GROUND-36-st.y,pB=GROUND-st.y,pL=PLAYER_X+5,pR=PLAYER_X+31;
      for(var i=0;i<st.obs.length;i++){
        var o=st.obs[i],oL=o.x+4,oR=o.x+o.w-4,oT=GROUND-o.h+4;
        if(pR>oL&&pL<oR&&pB>oT&&pT<GROUND){gameOver();return;}
      }
    }
    function gameOver(){
      st.mode='over';sfx.over();
      if(st.score>hi){hi=Math.floor(st.score);try{localStorage.setItem('reel-runner-hi',hi);}catch(e){}}
    }
    function hidden(){return gameWin.classList.contains('is-closed')||gameWin.classList.contains('is-min');}
    function frame(t){
      raf=0;
      if(hidden()){if(st.mode==='run')st.mode='paused';draw();return;}
      if(!last)last=t;
      acc+=Math.min(100,t-last);last=t;
      while(acc>=1000/60&&st.mode==='run'){step();acc-=1000/60;}
      draw();
      if(st.mode==='run')raf=requestAnimationFrame(frame);
    }
    function run(){if(!raf){last=0;acc=0;raf=requestAnimationFrame(frame);}}
    function press(){
      if(hidden())return;
      if(st.mode==='over'){fresh('run');run();return;}
      if(st.mode==='ready'||st.mode==='paused'){st.mode='run';run();}
      if(st.y===0){st.vy=10.6;sfx.jump();}
    }
    document.addEventListener('keydown',function(e){
      if(hidden())return;
      if(e.key!==' '&&e.key!=='ArrowUp'&&e.key!=='w'&&e.key!=='W')return;
      if(e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]'))return;
      e.preventDefault();
      if(!e.repeat)press();
    });
    cv.addEventListener('pointerdown',function(e){e.preventDefault();press();});
    fresh('ready');draw();
    return {ready:function(){if(st.mode!=='run'){fresh('ready');draw();}}};
  })();

  /* =====================================================
     JUKEBOX — plays MIDI files with a tiny built-in chiptune synth.
     Songs live in assets/music/jukebox-tracks.js
     ===================================================== */
  var juke=(function(){
    var W=jukeWin,q=function(sel){return W.querySelector(sel);};
    var listEl=q('.jb-list'),playBtn=q('.jb-play'),marq=q('.jb-marquee span'),stateEl=q('.jb-state'),
        curEl=q('.jb-cur'),durEl=q('.jb-dur'),seek=q('.jb-seek'),seekFill=q('.jb-seek b'),
        vol=q('.jb-vol input'),fileIn=q('.jb-load input'),viz=q('.jb-viz'),vx=viz.getContext('2d');
    var tracks=[],cur=-1,song=null,ctx=null,master=null,noise=null;
    var playing=false,startAt=0,pausedAt=0,ni=0,voices=[],sounding=[],timer=0,vizRaf=0,loaded=false;
    try{var v0=localStorage.getItem('jukebox-vol');if(v0!==null)vol.value=v0;}catch(e){}

    /* ---- MIDI file reader ---- */
    function parseMidi(buf){
      var d=new DataView(buf),p=0,L=d.byteLength;
      function str(n){var t='';for(var i=0;i<n;i++)t+=String.fromCharCode(d.getUint8(p+i));p+=n;return t;}
      function u32(){var v=d.getUint32(p);p+=4;return v;}
      function u16(){var v=d.getUint16(p);p+=2;return v;}
      function vlq(){var v=0,b;do{b=d.getUint8(p++);v=(v*128)+(b&127);}while(b&128);return v;}
      if(str(4)!=='MThd')throw new Error('Not a MIDI file');
      var hl=u32(),fmt=u16(),ntr=u16(),div=u16();p=8+hl;
      var evs=[],ord=0;
      for(var t=0;t<ntr&&p+8<=L;t++){
        var id=str(4),len=u32(),end=Math.min(L,p+len);
        if(id!=='MTrk'){p=end;continue;}
        var tick=0,run=0;
        try{
          while(p<end){
            tick+=vlq();
            var st=d.getUint8(p);
            if(st<0x80)st=run;else{p++;if(st<0xF0)run=st;}
            if(st===0xFF){
              var type=d.getUint8(p++),l=vlq();
              if(type===0x51)evs.push({tick:tick,kind:'tempo',v:(d.getUint8(p)<<16)|(d.getUint8(p+1)<<8)|d.getUint8(p+2),o:ord++});
              p+=l;if(type===0x2F)break;
            }else if(st===0xF0||st===0xF7){p+=vlq();}
            else{
              var ty=st&0xF0,a=d.getUint8(p++),b=(ty===0xC0||ty===0xD0)?0:d.getUint8(p++);
              evs.push({tick:tick,kind:ty,ch:st&15,a:a,b:b,o:ord++});
            }
          }
        }catch(e){/* truncated track: keep what we read */}
        p=end;
      }
      evs.sort(function(x,y){return x.tick-y.tick||(x.kind==='tempo'?-1:0)-(y.kind==='tempo'?-1:0)||x.o-y.o;});
      var tempo=500000,lastTick=0,sec=0,ppq=(div&0x8000)?480:div;
      var prog=[],vols=[],expr=[],open={},notes=[];
      for(var c=0;c<16;c++){prog[c]=0;vols[c]=100/127;expr[c]=1;}
      evs.forEach(function(e){
        sec+=(e.tick-lastTick)*tempo/1e6/ppq;lastTick=e.tick;
        if(e.kind==='tempo'){tempo=e.v||500000;return;}
        var key=e.ch*128+e.a;
        if(e.kind===0x90&&e.b>0){
          var n={start:sec,end:-1,pitch:e.a,vel:e.b,ch:e.ch,prog:prog[e.ch],vol:vols[e.ch]*expr[e.ch]};
          (open[key]=open[key]||[]).push(n);notes.push(n);
        }else if(e.kind===0x80||(e.kind===0x90&&e.b===0)){
          var o=open[key];if(o&&o.length)o.shift().end=sec;
        }else if(e.kind===0xC0)prog[e.ch]=e.a;
        else if(e.kind===0xB0){if(e.a===7)vols[e.ch]=e.b/127;else if(e.a===11)expr[e.ch]=e.b/127;}
      });
      var dur=0;
      notes.forEach(function(n){if(n.end<0)n.end=n.start+0.5;if(n.end-n.start<0.03)n.end=n.start+0.03;dur=Math.max(dur,n.end);});
      notes.sort(function(a,b){return a.start-b.start;});
      return {notes:notes,duration:dur};
    }

    /* ---- synth ---- */
    function audio(){
      if(ctx)return ctx;
      ctx=ensureCtx();if(!ctx)return null;
      var comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
      master=ctx.createGain();master.connect(comp);comp.connect(ctx.destination);
      setVol();
      noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
      var nd=noise.getChannelData(0);for(var i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
      return ctx;
    }
    function setVol(){if(master){var v=vol.value/100;master.gain.setTargetAtTime(v*v*0.9,ctx.currentTime,.02);}}
    // GM instrument families -> retro voices
    function patch(p){
      if(p<8)return{w:'triangle',a:.004,d:.5,s:.3,r:.15};            // piano
      if(p<16)return{w:'sine',a:.002,d:.6,s:.15,r:.3};               // bells / mallets
      if(p<24)return{w:'square',a:.01,d:.2,s:.8,r:.08,g:.55};         // organ
      if(p<32)return{w:'sawtooth',a:.004,d:.35,s:.35,r:.1,lp:2600};   // guitar
      if(p<40)return{w:'triangle',a:.004,d:.3,s:.7,r:.08,g:1.4};      // bass
      if(p<56)return{w:'sawtooth',a:.08,d:.3,s:.8,r:.25,lp:2200,g:.6};// strings / choir
      if(p<64)return{w:'sawtooth',a:.03,d:.2,s:.8,r:.1,lp:3000,g:.7}; // brass
      if(p<80)return{w:'square',a:.03,d:.2,s:.8,r:.1,g:.5};           // reed / pipe
      if(p<88)return{w:'square',a:.005,d:.2,s:.7,r:.08,g:.55};        // synth lead
      if(p<96)return{w:'sawtooth',a:.25,d:.5,s:.8,r:.4,lp:1800,g:.5}; // pads
      return{w:'triangle',a:.01,d:.3,s:.5,r:.1};
    }
    function track(node,g,end){voices.push({n:node,g:g,end:end});}
    function voice(n,t0,t1){
      var v=(n.vel/127)*n.vol*0.2;
      if(n.ch===9){drum(n.pitch,t0,v);return;}
      var P=patch(n.prog),f=440*Math.pow(2,(n.pitch-69)/12);
      v*=(P.g||1);
      var o=ctx.createOscillator(),g=ctx.createGain(),out=g;
      o.type=P.w;o.frequency.value=f;
      if(P.lp){var flt=ctx.createBiquadFilter();flt.type='lowpass';flt.frequency.value=P.lp;o.connect(flt);flt.connect(g);}else o.connect(g);
      g.connect(master);
      g.gain.setValueAtTime(0,t0);
      g.gain.linearRampToValueAtTime(v,t0+P.a);
      g.gain.setTargetAtTime(v*P.s,t0+P.a,P.d/3);
      g.gain.setTargetAtTime(0,t1,P.r/3);
      o.start(t0);o.stop(t1+P.r*3);
      track(o,g,t1+P.r*3);
    }
    function drum(k,t,v){
      var g=ctx.createGain();g.connect(master);
      if(k===35||k===36){                                   // kick
        var o=ctx.createOscillator();o.type='sine';
        o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);
        g.gain.setValueAtTime(v*3.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);
        o.connect(g);o.start(t);o.stop(t+.25);track(o,g,t+.25);return;
      }
      var tom=(k===41||k===43||k===45||k===47||k===48||k===50);
      if(tom){
        var ot=ctx.createOscillator();ot.type='sine';var base=80+(k-41)*14;
        ot.frequency.setValueAtTime(base*1.6,t);ot.frequency.exponentialRampToValueAtTime(base,t+.18);
        g.gain.setValueAtTime(v*2.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);
        ot.connect(g);ot.start(t);ot.stop(t+.32);track(ot,g,t+.32);return;
      }
      var src=ctx.createBufferSource();src.buffer=noise;
      var f=ctx.createBiquadFilter(),len=.12,amp=v*1.6;
      if(k===38||k===40||k===37||k===39){f.type='bandpass';f.frequency.value=1800;len=.16;amp=v*2.4;}  // snare / clap
      else if(k===42||k===44){f.type='highpass';f.frequency.value=7000;len=.05;amp=v*1.1;}              // closed hat
      else if(k===46){f.type='highpass';f.frequency.value=6500;len=.25;amp=v*1.1;}                     // open hat
      else if(k===49||k===57||k===52||k===55){f.type='highpass';f.frequency.value=5000;len=.9;amp=v*1.2;} // crash
      else if(k===51||k===53||k===59){f.type='highpass';f.frequency.value=8000;len=.35;amp=v*.9;}      // ride
      else{f.type='bandpass';f.frequency.value=3000;len=.08;}
      src.connect(f);f.connect(g);
      g.gain.setValueAtTime(amp,t);g.gain.exponentialRampToValueAtTime(.001,t+len);
      src.start(t);src.stop(t+len+.02);track(src,g,t+len+.02);
    }
    function silence(){
      var now=ctx?ctx.currentTime:0;
      voices.forEach(function(x){try{x.g.gain.cancelScheduledValues(now);x.g.gain.setTargetAtTime(0,now,.01);x.n.stop(now+.06);}catch(e){}});
      voices=[];sounding=[];
    }

    /* ---- transport ---- */
    function pos(){return playing?ctx.currentTime-startAt:pausedAt;}
    function fmt(t){t=Math.max(0,Math.floor(t));return Math.floor(t/60)+':'+('0'+(t%60)).slice(-2);}
    function tickSched(){
      if(!playing||!song)return;
      var now=ctx.currentTime,p=now-startAt,horizon=p+0.25,N=song.notes;
      while(ni<N.length&&N[ni].start<horizon){
        var n=N[ni++];
        if(n.start>=p-0.03){voice(n,startAt+n.start,startAt+n.end);sounding.push(n);}
      }
      voices=voices.filter(function(x){return x.end>now;});
      if(p>song.duration+0.6)next(true);
    }
    function startFrom(p){
      if(!audio()||!song)return;
      silence();
      ni=0;while(ni<song.notes.length&&song.notes[ni].start<p)ni++;
      startAt=ctx.currentTime-p+0.06;playing=true;
      clearInterval(timer);timer=setInterval(tickSched,40);tickSched();
      paint();runViz();
    }
    function pause(){if(!playing)return;pausedAt=pos();playing=false;clearInterval(timer);silence();paint();}
    function stop(){playing=false;pausedAt=0;clearInterval(timer);silence();paint();drawViz();}
    function load(i,autoplay){
      if(!tracks.length)return;
      cur=(i+tracks.length)%tracks.length;
      var tr=tracks[cur];
      try{
        if(!tr.song){
          var bin=atob(tr.data),u=new Uint8Array(bin.length);
          for(var k=0;k<bin.length;k++)u[k]=bin.charCodeAt(k);
          tr.song=parseMidi(u.buffer);
        }
        song=tr.song;
      }catch(e){song=null;marq.textContent='⚠ could not read '+tr.title;stop();return;}
      stop();
      marq.textContent='♪ '+(tr.artist?tr.artist+' — ':'')+tr.title+' ♪';
      durEl.textContent=fmt(song.duration);
      renderList();
      if(autoplay)startFrom(0);
    }
    function next(auto){if(tracks.length)load(cur+1,true);}
    function prev(){if(pos()>3)startFrom(0);else load(cur-1,true);}
    function toggle(){
      if(!song){if(tracks.length)load(cur<0?0:cur,true);return;}
      if(playing)pause();else startFrom(pausedAt);
    }
    function paint(){
      playBtn.textContent=playing?'❚❚':'▶';
      stateEl.textContent=playing?'▶ PLAY':(pausedAt>0?'❚❚ PAUSE':'■ STOP');
      W.classList.toggle('is-playing',playing);
    }
    function renderList(){
      listEl.innerHTML='';
      tracks.forEach(function(tr,i){
        var li=document.createElement('li'),b=document.createElement('button');
        b.type='button';b.textContent=(i===cur?'▶ ':'')+tr.title+(tr.artist?' — '+tr.artist:'');
        if(i===cur)li.className='on';
        b.addEventListener('click',function(){load(i,true);});
        li.appendChild(b);listEl.appendChild(li);
      });
    }

    /* ---- LCD visualiser + clock ---- */
    function drawViz(){
      var Wd=viz.width,Hd=viz.height,bars=20,bw=Wd/bars;
      vx.fillStyle='#071a14';vx.fillRect(0,0,Wd,Hd);
      var lv=new Array(bars).fill(0),p=pos();
      sounding=sounding.filter(function(n){return n.end+0.15>p;});
      sounding.forEach(function(n){
        if(n.start>p)return;
        var b=n.ch===9?(n.pitch<40?0:bars-1):Math.min(bars-2,Math.max(1,Math.floor((n.pitch-28)/3)));
        var age=p-n.start,amp=(n.vel/127)*Math.max(.25,1-age*0.8)*(p>n.end?Math.max(0,1-(p-n.end)*7):1);
        lv[b]=Math.min(1,lv[b]+amp*0.7);
      });
      for(var i=0;i<bars;i++){
        var h=Math.round(lv[i]*(Hd-6)/4)*4;
        for(var y=0;y<h;y+=4){
          vx.fillStyle=y>Hd*0.7?'#ff3df0':(y>Hd*0.45?'#ffe14d':'#54e6d0');
          vx.fillRect(Math.round(i*bw)+2,Hd-3-y-3,Math.round(bw)-4,3);
        }
      }
      curEl.textContent=fmt(Math.min(p,song?song.duration:0));
      seekFill.style.width=(song&&song.duration?Math.min(100,p/song.duration*100):0)+'%';
    }
    function runViz(){
      if(vizRaf)return;
      (function loop(){
        drawViz();
        vizRaf=playing?requestAnimationFrame(loop):0;
      })();
    }

    /* ---- controls ---- */
    W.querySelector('.jb-ctrls').addEventListener('click',function(e){
      var b=e.target.closest('[data-jb]');if(!b)return;
      var a=b.getAttribute('data-jb');
      if(a==='play')toggle();else if(a==='stop')stop();else if(a==='next')next();else if(a==='prev')prev();
    });
    vol.addEventListener('input',function(){setVol();try{localStorage.setItem('jukebox-vol',vol.value);}catch(e){}});
    seek.addEventListener('click',function(e){
      if(!song)return;
      var r=seek.getBoundingClientRect(),t=(e.clientX-r.left)/r.width*song.duration;
      if(playing)startFrom(t);else{pausedAt=t;drawViz();paint();}
    });
    fileIn.addEventListener('change',function(){
      var f=fileIn.files&&fileIn.files[0];if(!f)return;
      var rd=new FileReader();
      rd.onload=function(){
        try{
          var sng=parseMidi(rd.result);
          tracks.push({title:f.name.replace(/\.midi?$/i,''),artist:'',song:sng});
          load(tracks.length-1,true);
        }catch(err){marq.textContent='⚠ that file isn\'t a MIDI song';}
      };
      rd.readAsArrayBuffer(f);fileIn.value='';
    });
    W._onclose=stop;

    function boot(){
      tracks=(window.JUKEBOX_TRACKS||[]).slice();
      loaded=true;
      if(!tracks.length){marq.textContent='♪ no songs yet ♪';return;}
      if(cur<0){cur=0;load(0,false);}else renderList();
    }
    drawViz();
    return {
      open:function(cb){
        if(loaded){if(cb)cb();return;}
        if(window.JUKEBOX_TRACKS){boot();if(cb)cb();return;}
        var sc=document.createElement('script');
        sc.src='assets/music/jukebox-tracks.js';
        sc.onload=function(){boot();if(cb)cb();};
        sc.onerror=function(){loaded=true;marq.textContent='⚠ playlist not found';if(cb)cb();};
        document.head.appendChild(sc);
      },
      // pick a different song at random and start it; returns the track
      playRandom:function(){
        if(!tracks.length)return null;
        var i=Math.floor(Math.random()*tracks.length);
        if(tracks.length>1&&i===cur)i=(i+1+Math.floor(Math.random()*(tracks.length-1)))%tracks.length;
        load(i,true);
        return tracks[cur];
      }
    };
  })();

  /* =====================================================
     REC — a little desktop helper (the site's pixel smiley).
     Click him for a joke, a random song or a random project.
     Desktop only (hidden on touch screens / narrow windows).
     ===================================================== */
  var buddy=(function(){
    var PROJECTS=[
      ['portrait-photography.html','Portrait Photography'],
      ['wedding-videography.html','Wedding Videography'],
      ['event-photography.html','Event Photography'],
      ['my-dead-girlfriend.html','My Dead Girlfriend Keeps Messaging Me On Facebook'],
      ['simulacrum.html','Simulacrum']
    ];
    var JOKES=[
      "Why are photographers so optimistic? They develop from negatives. 📸",
      "I'd tell you a joke about a floppy disk… but you'd need a drive to get it. 💾",
      "I tried to take a photo of the fog this morning. I mist. 🌫️",
      "What's a camera's favorite drink? Shots. Lots of shots. 🥃",
      "What do you call a photo of a bear with no ears? A 'b'. 🐻",
      "Why did the VHS tape go to therapy? Too many unresolved tracking issues. 📼",
      "My tripod never lets me down. It's the most supportive friend I have. 🦵🦵🦵",
      "Why was the film director so calm? He took life one scene at a time. 🎬",
      "What did the lens say to the camera? 'Stick with me — I see a bright future… with the right exposure.' ✨",
      "How many editors does it take to change a lightbulb? Just one, but it'll take three revisions. 💡",
      "Why did the movie extra get promoted? He really stood out in the background. 🧍",
      "I told my camera a secret. Now it won't stop flashing everyone. 😳"
    ];
    var HELLO=["Hi! I'm Rec ☺ What can I do for you?","Lights, camera… you clicked me! What'll it be?","Rec here, rolling and ready. Pick one!"];
    // 12x12 pixel smiley (same face as the site logo). k=ink y=yellow
    var BODY=[
      "...kkkkkk...",
      "..kyyyyyyk..",
      ".kyyyyyyyyk.",
      "kyyyyyyyyyyk",
      "kyykyyyykyyk",
      "kyykyyyykyyk",
      "kyyyyyyyyyyk",
      "kykyyyyyykyk",
      "kyykyyyykyyk",
      ".kyykkkkyyk.",
      "..kyyyyyyk..",
      "...kkkkkk..."];
    function variant(rows,patch){var r=rows.slice();Object.keys(patch).forEach(function(i){r[i]=patch[i];});return r;}
    var BLINK=variant(BODY,{4:"kyyyyyyyyyyk",5:"kykkyyyykkyk"});
    var TALK=variant(BODY,{7:"kyyyyyyyyyyk",8:"kyykkkkkkyyk",9:".kyykkkkyyk."});
    var COL={k:'#161020',y:'#ffe14d'};
    var PX=8;

    var root=document.createElement('div');
    root.className='buddy';
    root.innerHTML=
      '<div class="buddy-bubble" role="dialog" aria-label="Rec the helper" hidden>'+
        '<button type="button" class="buddy-x" aria-label="Close">×</button>'+
        '<p class="buddy-text"></p>'+
        '<div class="buddy-menu">'+
          '<button type="button" data-b="joke">😂 Tell me a joke</button>'+
          '<button type="button" data-b="song">🎵 Play a song</button>'+
          '<button type="button" data-b="go">🧭 Take me somewhere</button>'+
          '<button type="button" data-b="hide" class="buddy-hide">👋 Hide Rec</button>'+
        '</div>'+
      '</div>'+
      '<button type="button" class="buddy-me" aria-label="Rec the helper — click for options"><canvas width="96" height="96"></canvas></button>';
    document.body.appendChild(root);
    var bubble=root.querySelector('.buddy-bubble'),textEl=root.querySelector('.buddy-text'),
        menuEl=root.querySelector('.buddy-menu'),me=root.querySelector('.buddy-me'),
        cv=root.querySelector('canvas'),cx=cv.getContext('2d');
    var frame=BODY,talking=0,typeTimer=0,hideTimer=0;

    function draw(rows){
      cx.clearRect(0,0,cv.width,cv.height);
      for(var y=0;y<rows.length;y++)for(var x=0;x<rows[y].length;x++){
        var ch=rows[y][x];if(ch==='.')continue;
        cx.fillStyle=COL[ch];cx.fillRect(x*PX,y*PX,PX,PX);
      }
    }
    draw(BODY);
    // blink every few seconds, flap the mouth while talking
    setInterval(function(){if(!talking){draw(BLINK);setTimeout(function(){if(!talking)draw(BODY);},140);}},3800);
    setInterval(function(){if(talking){frame=frame===TALK?BODY:TALK;draw(frame);}},120);

    function say(msg,showMenu,autoHide){
      clearInterval(typeTimer);clearTimeout(hideTimer);
      bubble.hidden=false;root.classList.add('open');
      menuEl.hidden=!showMenu;
      textEl.textContent='';
      var i=0;talking=1;
      typeTimer=setInterval(function(){
        textEl.textContent=msg.slice(0,++i);
        if(i%3===0)tone(380+Math.random()*120,.03,'square',.018);
        if(i>=msg.length){clearInterval(typeTimer);talking=0;draw(BODY);}
      },22);
      if(autoHide)hideTimer=setTimeout(close,autoHide);
    }
    function close(){
      clearInterval(typeTimer);clearTimeout(hideTimer);talking=0;draw(BODY);
      bubble.hidden=true;root.classList.remove('open');
    }
    function pick(a){return a[Math.floor(Math.random()*a.length)];}
    var lastJoke=-1;
    function act(what){
      if(what==='joke'){
        var j;do{j=Math.floor(Math.random()*JOKES.length);}while(j===lastJoke&&JOKES.length>1);
        lastJoke=j;say(JOKES[j],true);
      }else if(what==='song'){
        ensureCtx();   // unlock audio while we still have the click
        say('Spinning up a random tune… 🎵',false);
        juke.open(function(){
          if(jukeWin.classList.contains('is-min')||jukeWin.classList.contains('is-closed'))openWin(jukeWin);
          var tr=juke.playRandom();
          say(tr?'Now playing: '+tr.title+(tr.artist?' by '+tr.artist:'')+' 🎶':'Hmm, I couldn\'t find any songs. 😕',true);
        });
      }else if(what==='go'){
        var here=location.pathname.split('/').pop()||'index.html';
        var opts=PROJECTS.filter(function(p){return p[0]!==here;});
        var p=pick(opts);
        say('Hold on to your popcorn! 🍿 Taking you to '+p[1]+'…',false);
        setTimeout(function(){close();go(p[0]);},1600);
      }else if(what==='hide'){
        say('Okay, I\'ll be in the Start menu if you need me! 👋',false);
        setTimeout(function(){close();setHidden(true);},1400);
      }
    }
    function setHidden(h){
      root.classList.toggle('is-hidden',h);
      try{localStorage.setItem('rec-hidden',h?'1':'0');}catch(e){}
    }
    try{if(localStorage.getItem('rec-hidden')==='1')root.classList.add('is-hidden');}catch(e){}

    // click Rec = open/close the menu; drag Rec = move him around the screen
    var drag=null;
    me.addEventListener('pointerdown',function(e){
      if(e.button!==0)return;
      var r=root.getBoundingClientRect();
      drag={sx:e.clientX,sy:e.clientY,l:r.left,t:r.top,moved:false};
      me.setPointerCapture(e.pointerId);
    });
    me.addEventListener('pointermove',function(e){
      if(!drag)return;
      var dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;
      if(!drag.moved&&Math.abs(dx)+Math.abs(dy)<5)return;
      drag.moved=true;root.classList.add('dragging');
      var W=window.innerWidth,H=window.innerHeight,bw=me.offsetWidth,bh=me.offsetHeight;
      var nl=Math.max(4,Math.min(W-bw-4,drag.l+dx)),nt=Math.max(60,Math.min(H-bh-50,drag.t+dy));
      root.style.left=nl+'px';root.style.top=nt+'px';root.style.right='auto';root.style.bottom='auto';
      root.classList.toggle('flip',nl<W/2);
    });
    function endDrag(){
      if(!drag)return;
      var wasDrag=drag.moved;drag=null;root.classList.remove('dragging');
      if(!wasDrag){
        if(bubble.hidden||menuEl.hidden){say(pick(HELLO),true);sfx.click();}
        else close();
      }
    }
    me.addEventListener('pointerup',endDrag);
    me.addEventListener('pointercancel',function(){drag=null;root.classList.remove('dragging');});
    me.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();if(bubble.hidden)say(pick(HELLO),true);else close();}});
    menuEl.addEventListener('click',function(e){var b=e.target.closest('[data-b]');if(b)act(b.getAttribute('data-b'));});
    root.querySelector('.buddy-x').addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!bubble.hidden)close();});

    // say hi once per visit
    var greeted=false;try{greeted=sessionStorage.getItem('rec-hi')==='1';}catch(e){}
    if(!greeted&&!root.classList.contains('is-hidden')){
      setTimeout(function(){
        if(!window.matchMedia('(min-width:861px) and (hover:hover)').matches)return;
        say('Hey there! 👋 I\'m Rec. Click me if you want a joke, a song, or a surprise!',false,7000);
        try{sessionStorage.setItem('rec-hi','1');}catch(e){}
      },2500);
    }
    return {
      toggle:function(){
        if(root.classList.contains('is-hidden')){setHidden(false);say('I\'m back! ☺ What can I do for you?',true);}
        else{close();setHidden(true);}
      }
    };
  })();
  bar.querySelector('.sm-buddy').addEventListener('click',function(){setMenu(false);buddy.toggle();});

  /* =====================================================
     PAGE SETUP — runs on first load and after every page change
     ===================================================== */
  var pageTimers=[];
  function initPage(){
    // mobile nav toggle
    var t=document.getElementById('navtoggle'),n=document.getElementById('nav');
    if(t&&n)t.addEventListener('click',function(){n.classList.toggle('open');});
    // current year in footer
    var y=document.getElementById('yr');
    if(y)y.textContent=new Date().getFullYear();
    tick();
    // animate any loading bar (the "rendering…" window)
    [].forEach.call(document.querySelectorAll('.loadbar'),function(lb){
      var cells=lb.querySelectorAll('i'),k=6;
      function paint(){for(var i=0;i<cells.length;i++)cells[i].classList.toggle('on',i<k);}
      paint();
      pageTimers.push(setInterval(function(){k=k>=cells.length?0:k+1;paint();},450));
    });
    // contact form: send to Formspree without leaving the page
    var cf=document.getElementById('contactform');
    if(cf){
      var st=cf.querySelector('.formstatus'),sb=cf.querySelector('button[type=submit]');
      function say(msg,kind){st.textContent=msg;st.className='formstatus '+(kind||'');}
      cf.addEventListener('submit',function(e){
        e.preventDefault();
        if(cf.action.indexOf('YOUR_FORM_ID')>-1){say('⚠ This form isn\'t connected yet.','err');return;}
        sb.disabled=true;say('Sending… ⌛','');
        fetch(cf.action,{method:'POST',body:new FormData(cf),headers:{'Accept':'application/json'}})
          .then(function(r){return r.json().catch(function(){return {};}).then(function(d){return {ok:r.ok,d:d};});})
          .then(function(res){
            if(res.ok){cf.reset();say('✔ Message sent! I\'ll get back to you soon.','ok');}
            else{
              var m=res.d&&res.d.errors?res.d.errors.map(function(x){return x.message;}).join(' '):'';
              say('✖ '+(m||'Something went wrong. Please try again.'),'err');
            }
          })
          .catch(function(){say('✖ Couldn\'t reach the server. Check your connection and try again.','err');})
          .then(function(){sb.disabled=false;});
      });
    }
  }
  initPage();

  /* =====================================================
     SEAMLESS PAGE CHANGES
     Links inside the site swap just the page content, so the
     taskbar, Jukebox and Reel Runner keep running between pages.
     (When the site is opened straight from a computer — file:// —
     browsers block this, so links load pages the normal way.)
     ===================================================== */
  [].forEach.call(document.head.querySelectorAll('style'),function(st){st.setAttribute('data-page','');});
  var navBusy=0;
  function swapTo(html){
    var doc=new DOMParser().parseFromString(html,'text/html');
    var nwrap=doc.querySelector('.wrap'),owrap=document.querySelector('.wrap');
    if(!nwrap||!owrap)throw new Error('not a site page');
    // put away the old page's windows
    wins.forEach(function(w){
      if(w.hasAttribute('data-app'))return;
      if(w.classList.contains('maxed'))toggleMax(w);
      removeTask(w);
    });
    pageTimers.forEach(clearInterval);pageTimers=[];
    // head: title, description, page-only styles
    document.title=doc.title;
    var md=doc.querySelector('meta[name="description"]'),cd=document.querySelector('meta[name="description"]');
    if(md&&cd)cd.setAttribute('content',md.getAttribute('content')||'');
    [].forEach.call(document.head.querySelectorAll('style[data-page]'),function(st){st.remove();});
    [].forEach.call(doc.head.querySelectorAll('style'),function(st){
      var c=document.createElement('style');c.setAttribute('data-page','');c.textContent=st.textContent;document.head.appendChild(c);
    });
    // body: menu bar, page content, footer
    [['.menubar'],['.wrap'],['.footer']].forEach(function(sel){
      var o=document.querySelector(sel[0]),nn=doc.querySelector(sel[0]);
      if(o&&nn)o.replaceWith(document.importNode(nn,true));
    });
    // wire up the new page's windows
    var fresh=[].slice.call(document.querySelectorAll('.wrap .win'));
    wins=wins.filter(function(w){return w.hasAttribute('data-app');}).concat(fresh);
    fresh.forEach(setupWin);
    initPage();
  }
  function go(url,push){
    var u=new URL(url,location.href);
    if(location.protocol==='file:'||u.origin!==location.origin){location.href=u.href;return;}
    if(u.pathname===location.pathname&&u.search===location.search&&u.hash&&push!==false){location.hash=u.hash;return;}
    var my=++navBusy;
    document.body.classList.add('is-loading');
    fetch(u.href,{credentials:'same-origin'})
      .then(function(r){if(!r.ok)throw new Error(r.status);return r.text();})
      .then(function(html){
        if(my!==navBusy)return;
        swapTo(html);
        if(push!==false)history.pushState({page:u.href},'',u.href);
        var target=u.hash&&document.getElementById(decodeURIComponent(u.hash.slice(1)));
        if(target)target.scrollIntoView();else window.scrollTo(0,0);
        var h=document.querySelector('.wrap h1, .wrap h2');
        if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true});}
      })
      .catch(function(){location.href=u.href;})
      .then(function(){if(my===navBusy)document.body.classList.remove('is-loading');});
  }
  document.addEventListener('click',function(e){
    if(location.protocol==='file:')return;
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
    if((a.target&&a.target!=='_self')||a.hasAttribute('download'))return;
    var href=a.getAttribute('href');
    if(!href||href.charAt(0)==='#'||/^(mailto|tel|javascript):/i.test(href))return;
    var u=new URL(a.href);
    if(u.origin!==location.origin||!/(\.html?|\/)$/i.test(u.pathname))return;
    e.preventDefault();
    setMenu(false);
    go(u.href);
  },true);   // capture phase, so links inside the Start menu are handled too
  window.addEventListener('popstate',function(){go(location.href,false);});
  if(history.replaceState)history.replaceState({page:location.href},'',location.href);
})();
