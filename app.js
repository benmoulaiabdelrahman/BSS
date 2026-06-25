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
