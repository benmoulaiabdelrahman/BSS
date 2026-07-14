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

// ---------- open/closed status (Africa/Algiers, UTC+1 year-round) ----------
function updateStatus(){
  var nowUTC = new Date(new Date().toUTCString());
  var algiersHour = (nowUTC.getUTCHours() + 1) % 24;
  var isOpen = algiersHour >= 11 && algiersHour < 23;
  var dot = document.getElementById('statusDot');
  var text = document.getElementById('statusText');
  if(!dot || !text) return;
  dot.classList.toggle('closed', !isOpen);
  var lang = document.documentElement.lang === 'ar' ? 'ar' : 'fr';
  text.textContent = isOpen
    ? (lang === 'ar' ? 'مفتوح الآن' : 'Ouvert maintenant')
    : (lang === 'ar' ? 'مغلق حالياً' : 'Fermé pour le moment');
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
  updateStatus();
}

// ---------- tabs ----------
function loadPanelImages(panel){
  if(!panel) return;
  panel.querySelectorAll('img[data-src]').forEach(function(img){
    img.src = img.getAttribute('data-src');
    img.removeAttribute('data-src');
  });
}

function initTabs(){
  // images for the panel that's active on page load
  loadPanelImages(document.querySelector('.panel.active'));

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
document.addEventListener('touchstart', function(){}, {passive:true});
document.addEventListener('touchmove',  function(){}, {passive:true});
document.addEventListener('wheel',      function(){}, {passive:true});

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
  langSingleBtn.setAttribute('data-target-lang', 'ar');
  langSingleBtn.addEventListener('click', function(){
    setLang(langSingleBtn.getAttribute('data-target-lang'));
  });
}

initTabs();
updateStatus();
setInterval(updateStatus, 60000);

/* ============================================================
   MOBILE SLIDER  (≤560 px)
   - Wraps .menu-item children of each .panel in a .slider-track
   - Adds arrow buttons, dot indicators, counter
   - Auto-plays with a 3.5 s interval, pauses on interaction
   - Supports touch swipe
   - Pizza drop-shadow slides with the image (handled by CSS transition)
   ============================================================ */

(function(){

  var MOBILE_BP = 768;
  var AUTO_INTERVAL = 3500;

  // One slider state per panel
  var sliders = [];

  function isMobile(){
    return window.innerWidth <= MOBILE_BP;
  }

  /* ---- Build slider DOM for one panel ---- */
  function buildSlider(panel){
    var items = Array.from(panel.querySelectorAll(':scope > .menu-item'));
    if(items.length === 0) return null;

    // Wrap items in a track div
    var track = document.createElement('div');
    track.className = 'slider-track';
    items.forEach(function(item){ track.appendChild(item); });
    panel.insertBefore(track, panel.firstChild);

    // Arrow buttons
    var arrows = document.createElement('div');
    arrows.className = 'slider-arrows';
    var btnPrev = document.createElement('button');
    btnPrev.className = 'slider-arrow slider-prev';
    btnPrev.setAttribute('aria-label', 'Précédent');
    btnPrev.innerHTML = '&#8592;';
    var btnNext = document.createElement('button');
    btnNext.className = 'slider-arrow slider-next';
    btnNext.setAttribute('aria-label', 'Suivant');
    btnNext.innerHTML = '&#8594;';
    arrows.appendChild(btnPrev);
    arrows.appendChild(btnNext);
    panel.appendChild(arrows);

    // Dots
    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'slider-dots';
    items.forEach(function(_, i){
      var d = document.createElement('span');
      d.className = 'slider-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('data-index', i);
      dotsWrap.appendChild(d);
    });
    panel.appendChild(dotsWrap);

    // Counter
    var counter = document.createElement('div');
    counter.className = 'slider-counter';
    panel.appendChild(counter);

    var state = {
      panel: panel,
      track: track,
      items: items,
      dots: Array.from(dotsWrap.querySelectorAll('.slider-dot')),
      counter: counter,
      btnPrev: btnPrev,
      btnNext: btnNext,
      current: 0,
      total: items.length,
      timer: null,
      built: true
    };

    // Update function
    function goTo(idx, userAction){
      // loop
      if(idx < 0) idx = state.total - 1;
      if(idx >= state.total) idx = 0;
      state.current = idx;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      state.dots.forEach(function(d, i){ d.classList.toggle('active', i === idx); });
      counter.textContent = (idx + 1) + ' / ' + state.total;
      if(userAction) resetAutoPlay(state);
    }
    state.goTo = goTo;

    // Arrows
    btnPrev.addEventListener('click', function(){ goTo(state.current - 1, true); });
    btnNext.addEventListener('click', function(){ goTo(state.current + 1, true); });

    // Dots
    state.dots.forEach(function(d){
      d.addEventListener('click', function(){
        goTo(parseInt(d.getAttribute('data-index')), true);
      });
    });

    // Touch swipe
    var touchStartX = 0;
    track.addEventListener('touchstart', function(e){
      touchStartX = e.touches[0].clientX;
      resetAutoPlay(state);
    }, {passive:true});
    track.addEventListener('touchend', function(e){
      var dx = e.changedTouches[0].clientX - touchStartX;
      if(Math.abs(dx) > 40){
        goTo(dx < 0 ? state.current + 1 : state.current - 1, true);
      }
    }, {passive:true});

    goTo(0, false);
    return state;
  }

  /* ---- Auto-play ---- */
  function startAutoPlay(state){
    if(state.timer) clearInterval(state.timer);
    state.timer = setInterval(function(){
      state.goTo(state.current + 1, false);
    }, AUTO_INTERVAL);
  }
  function resetAutoPlay(state){
    if(state.timer) clearInterval(state.timer);
    state.timer = setTimeout(function(){
      startAutoPlay(state);
    }, AUTO_INTERVAL * 1.5); // small pause after user interaction
  }

  /* ---- Unwrap slider DOM (for desktop) ---- */
  function destroySlider(state){
    var track = state.track;
    var panel = state.panel;
    // Move items back to panel
    state.items.forEach(function(item){ panel.insertBefore(item, track); });
    track.remove();
    // Remove controls
    var arrows = panel.querySelector('.slider-arrows');
    var dots = panel.querySelector('.slider-dots');
    var counter = panel.querySelector('.slider-counter');
    if(arrows) arrows.remove();
    if(dots) dots.remove();
    if(counter) counter.remove();
    if(state.timer) clearInterval(state.timer);
    state.built = false;
  }

  /* ---- Init / destroy on resize ---- */
  function initSliders(){
    var panels = Array.from(document.querySelectorAll('.panel'));
    if(isMobile()){
      panels.forEach(function(panel, i){
        if(!sliders[i] || !sliders[i].built){
          sliders[i] = buildSlider(panel);
        }
        if(sliders[i] && panel.classList.contains('active')){
          startAutoPlay(sliders[i]);
        }
      });
    } else {
      panels.forEach(function(panel, i){
        if(sliders[i] && sliders[i].built){
          destroySlider(sliders[i]);
        }
      });
      sliders = [];
    }
  }

  /* ---- Hook tab switches to restart auto-play ---- */
  function hookTabs(){
    document.querySelectorAll('.tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        if(!isMobile()) return;
        var panelName = tab.getAttribute('data-tab');
        var panel = document.querySelector('.panel[data-panel="' + panelName + '"]');
        if(!panel) return;
        // Load lazy images first
        loadPanelImages(panel);
        // Find or build slider for this panel
        var panels = Array.from(document.querySelectorAll('.panel'));
        var idx = panels.indexOf(panel);
        if(idx < 0) return;
        // Allow the panel to become active (handled by existing initTabs)
        setTimeout(function(){
          if(!sliders[idx] || !sliders[idx].built){
            sliders[idx] = buildSlider(panel);
          }
          if(sliders[idx]){
            sliders[idx].goTo(0, false);
            startAutoPlay(sliders[idx]);
          }
        }, 30);
      });
    });
  }

  /* ---- Resize debounce ---- */
  var resizeTimer;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initSliders, 120);
  });

  /* ---- Boot ---- */
  // Wait for initTabs() (already called above) to finish first
  setTimeout(function(){
    initSliders();
    hookTabs();
  }, 0);

})();
