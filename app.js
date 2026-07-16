/* ============================================================
   BSS FOOD – app.js
   All UI logic: language, tabs, status, image fallback, perf
   ============================================================ */

// ---------- menu image fallback ----------
var MENU_IMG_PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
  '<defs>' +
    '<radialGradient id="bg" cx="40%" cy="35%" r="70%">' +
      '<stop offset="0%" stop-color="#2e2318"/><stop offset="100%" stop-color="#0d0906"/>' +
    '</radialGradient>' +
  '</defs>' +
  '<circle cx="100" cy="100" r="100" fill="url(#bg)"/>' +
  '<g transform="translate(100,108)" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M-52-50 A68 68 0 0 1 52-50" stroke="#c8915a" stroke-width="9" fill="none"/>' +
    '<path d="M-52-50 L0 62 L52-50 Z" stroke="#ff9233" stroke-width="5" fill="rgba(255,146,51,0.1)"/>' +
    '<circle cx="-18" cy="-10" r="7" fill="#ff5468" opacity="0.85"/>' +
    '<circle cx="20" cy="-18" r="7" fill="#ff5468" opacity="0.85"/>' +
    '<circle cx="2" cy="12" r="6" fill="#ff5468" opacity="0.85"/>' +
    '<circle cx="-8" cy="-32" r="5" fill="#c8915a" opacity="0.7"/>' +
    '<circle cx="28" cy="5" r="5" fill="#c8915a" opacity="0.7"/>' +
  '</g>' +
  '</svg>'
);

function handleImgErr(el){
  el.onerror = null;
  el.src = MENU_IMG_PLACEHOLDER;
  el.classList.add('img-placeholder');
  var photo = el.closest('.menu-photo');
  if(photo){ photo.style.minHeight = '140px'; }
}

// ---------- language toggle ----------
function setLang(lang){
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-lang-btn]').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-lang-btn') === lang);
  });
  document.querySelectorAll('[data-fr][data-ar]').forEach(function(el){
    el.textContent = el.getAttribute('data-' + lang);
  });
  var singleBtn = document.getElementById('langSingleBtn');
  if(singleBtn){
    singleBtn.textContent = (lang === 'fr') ? 'ع' : 'FR';
    singleBtn.setAttribute('data-target-lang', (lang === 'fr') ? 'ar' : 'fr');
  }
}

// ---------- tabs ----------
function loadPanelImages(panel){
  if(!panel) return;
  panel.querySelectorAll('img[data-src]').forEach(function(img){
    if(img.hasAttribute('data-srcset')){
      img.srcset = img.getAttribute('data-srcset');
      img.removeAttribute('data-srcset');
    }
    if(img.hasAttribute('data-sizes')){
      img.sizes = img.getAttribute('data-sizes');
      img.removeAttribute('data-sizes');
    }
    img.src = img.getAttribute('data-src');
    img.removeAttribute('data-src');
  });
}

function initTabs(){
  // load images when the menu comes near the viewport

  document.querySelectorAll('.tab').forEach(function(tab){
    tab.addEventListener('click', function(){
      document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
      tab.classList.add('active');
      var panel = document.querySelector('.panel[data-panel="' + tab.getAttribute('data-tab') + '"]');
      if(panel){
        panel.classList.add('active');
        loadPanelImages(panel);
      }
    });
  });
}

// ---------- performance: passive listeners ----------

// ---------- performance: IntersectionObserver for section reveals ----------
if('IntersectionObserver' in window){
  var revealObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); revealObs.unobserve(e.target); }
    });
  }, {rootMargin:'0px 0px -60px 0px'});
  document.querySelectorAll('.section').forEach(function(s){ revealObs.observe(s); });
}

// ---------- init (runs after DOM is ready via defer) ----------
document.querySelectorAll('[data-lang-btn]').forEach(function(btn){
  btn.addEventListener('click', function(){ setLang(btn.getAttribute('data-lang-btn')); });
});

var langSingleBtn = document.getElementById('langSingleBtn');
if(langSingleBtn){
  langSingleBtn.setAttribute('data-target-lang', 'fr');
  langSingleBtn.addEventListener('click', function(){
    setLang(langSingleBtn.getAttribute('data-target-lang'));
  });
}

initTabs();

var menuSection = document.getElementById('menu');
if(menuSection && 'IntersectionObserver' in window){
  var menuObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        loadPanelImages(document.querySelector('.panel.active'));
        menuObs.disconnect();
      }
    });
  }, {rootMargin:'200px 0px'});
  menuObs.observe(menuSection);
} else {
  loadPanelImages(document.querySelector('.panel.active'));
}

setLang('ar');

/* ── MOBILE SLIDER ≤768px ── */
(function(){
  var BP = 768, DELAY = 3500;

  /* cache viewport width; touchmove/go fire a lot during a drag, so we
     avoid re-querying window.innerWidth (a layout-forcing read) on every
     single event and only refresh it on init/resize instead.
     NOTE: don't read it here at parse time — setLang() just ran above us
     and dirtied the DOM (textContent + dir + class toggles), so an
     immediate layout read here forces a synchronous reflow. init() (below,
     called via requestAnimationFrame) sets the real value before it's
     ever used, so 0 is a safe placeholder. */
  var vw = 0;

  function isMobile(){ return vw <= BP; }

  function build(panel){
    if(panel._sb) return;
    panel._sb = true;

    var items = [];
    for(var i=0;i<panel.children.length;i++){
      if(panel.children[i].classList.contains('menu-item'))
        items.push(panel.children[i]);
    }
    if(!items.length) return;

    /* track */
    var track = document.createElement('div');
    track.className = 'slider-track';
    items.forEach(function(it){ track.appendChild(it); });
    panel.insertBefore(track, panel.firstChild);

    /* controls */
    var ctrl = document.createElement('div'); ctrl.className='slider-controls';
    var arrowsDiv = document.createElement('div'); arrowsDiv.className='slider-arrows';
    var prev = document.createElement('button');
    prev.className='slider-arrow';
    prev.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    prev.setAttribute('aria-label','Précédent');
    var next = document.createElement('button');
    next.className='slider-arrow';
    next.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    next.setAttribute('aria-label','Suivant');
    arrowsDiv.appendChild(prev); arrowsDiv.appendChild(next);

    var dotsDiv = document.createElement('div'); dotsDiv.className='slider-dots';
    var dots = items.map(function(_,i){
      var d=document.createElement('span');
      d.className='slider-dot'+(i===0?' active':'');
      dotsDiv.appendChild(d); return d;
    });

    var counter = document.createElement('div'); counter.className='slider-counter';

    ctrl.appendChild(dotsDiv); ctrl.appendChild(counter);
    panel.appendChild(arrowsDiv);
    panel.appendChild(ctrl);

    var cur=0, timer=null;

    function go(idx, user){
      if(idx<0) idx=items.length-1;
      if(idx>=items.length) idx=0;
      cur=idx;
      track.style.transform='translateX(-'+(cur*vw)+'px)';
      dots.forEach(function(d,i){ d.classList.toggle('active',i===cur); });
      counter.textContent=(cur+1)+' / '+items.length;
      if(user) pauseResume();
    }
    function startAuto(){ if(timer)clearInterval(timer); timer=setInterval(function(){ go(cur+1,false); },DELAY); }
    function stopAuto(){ if(timer){ clearInterval(timer); timer=null; } }
    function pauseResume(){ stopAuto(); timer=setTimeout(startAuto, DELAY*1.5); }

    prev.addEventListener('click',function(){ go(cur-1,true); });
    next.addEventListener('click',function(){ go(cur+1,true); });
    dots.forEach(function(d,i){ d.addEventListener('click',function(){ go(i,true); }); });

    /* swipe — live drag that follows the finger */
    var tx0=0, dx=0, dragging=false, baseX=0;

    function setTrackX(px, withTransition){
      track.style.transition = withTransition ? '' : 'none';
      track.style.transform = 'translateX(' + px + 'px)';
    }

    track.addEventListener('touchstart',function(e){
      tx0 = e.touches[0].clientX;
      dx = 0;
      dragging = true;
      baseX = -(cur * vw);
      stopAuto();
      setTrackX(baseX, false); /* kill transition so drag tracks 1:1 */
    },{passive:true});

    track.addEventListener('touchmove',function(e){
      if(!dragging) return;
      dx = e.touches[0].clientX - tx0;

      /* resistance at the ends so it doesn't drag past first/last slide */
      var atStart = (cur===0 && dx>0);
      var atEnd   = (cur===items.length-1 && dx<0);
      var moveX = (atStart||atEnd) ? dx*0.35 : dx;

      setTrackX(baseX + moveX, false);
    },{passive:true});

    track.addEventListener('touchend',function(){
      if(!dragging) return;
      dragging = false;
      var threshold = vw * 0.18; /* 18% of screen width to trigger a slide change */

      track.style.transition = ''; /* re-enable the CSS transition (was 'none' during drag) */

      if(Math.abs(dx) > threshold){
        go(dx<0 ? cur+1 : cur-1, true);
      } else {
        setTrackX(baseX, true); /* snap back to current slide */
        pauseResume();
      }
    },{passive:true});

    track.addEventListener('touchcancel',function(){
      if(!dragging) return;
      dragging = false;
      track.style.transition = '';
      setTrackX(baseX, true);
      pauseResume();
    },{passive:true});

    /* recalc on resize */
    window.addEventListener('resize',function(){
      track.style.transition='none';
      track.style.transform='translateX(-'+(cur*vw)+'px)';
      setTimeout(function(){ track.style.transition=''; },50);
    });

    panel._sbGo=go; panel._sbStart=startAuto; panel._sbStop=stopAuto;
    go(0,false);
    if(panel.classList.contains('active')) startAuto();
  }

  function destroy(panel){
    if(!panel._sb) return;
    panel._sbStop && panel._sbStop();
    var track=panel.querySelector('.slider-track');
    var ctrl=panel.querySelector('.slider-controls');
    if(track){ while(track.firstChild) panel.insertBefore(track.firstChild,track); track.remove(); }
    if(ctrl) ctrl.remove();
    panel._sb=false; panel._sbGo=panel._sbStart=panel._sbStop=null;
  }

  function init(){
    vw = window.innerWidth;
    var ps=Array.from(document.querySelectorAll('.panel'));
    if(isMobile()){
      ps.forEach(function(panel){
        /* only the visible tab needs to exist before first paint to avoid
           a layout shift; the other tabs are built lazily when clicked
           (see the tab click handler below), so we don't pay the DOM cost
           of building all of them up front. */
        if(panel.classList.contains('active')) build(panel);
      });
    }
    else { ps.forEach(destroy); }
  }

  /* re-hook tabs */
  document.querySelectorAll('.tab').forEach(function(tab){
    tab.addEventListener('click',function(){
      if(!isMobile()) return;
      var panel=document.querySelector('.panel[data-panel="'+tab.getAttribute('data-tab')+'"]');
      if(!panel) return;
      setTimeout(function(){
        if(!panel._sb) build(panel);
        if(panel._sbGo) panel._sbGo(0,false);
        if(panel._sbStop) panel._sbStop();
        if(panel._sbStart) panel._sbStart();
      },30);
    });
  });

  var rTimer;
  window.addEventListener('resize',function(){ clearTimeout(rTimer); rTimer=setTimeout(init,150); });

  requestAnimationFrame(init);
})();
