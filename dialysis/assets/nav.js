/* CKS header: nm.org-style mega menus (intro, grouped links, featured story) and the phone drawer,
   built from one list so the home page and the gallery always match.
   Usage: <script src="assets/nav.js" data-base=""></script> on the home page, data-base="index.html" elsewhere. */
(function(){
  'use strict';
  var me=document.currentScript, base=(me&&me.getAttribute('data-base'))||'';
  var here=location.pathname.split('/').pop()||'index.html';
  function u(h){return h.charAt(0)==='#'?base+h:h}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var MENUS=[
    {id:'care',label:'Care & Services',intro:'From your first kidney function test to dialysis and transplant work-up, one renal team led by our nephrologist.',all:['#services','All Care & Services'],
     cols:[{h:'Kidney care',l:[['#services','Haemodialysis'],['#services','Kidney Transplant Work-Up'],['#services','Outpatient Nephrology'],['#services','Catheter & Fistula Care'],['#services','Kidney Biopsy'],['#services','Renal Nutrition']]},
           {h:'Tests & screening',l:[['#services','Kidney Function Tests'],['#services','Screening & Diagnostics'],['#branches','Lab & Imaging at Kimuka, 24/7'],['#book','Book a Screening']]}],
     feat:{img:'assets/img/sm/dialysis2.jpg',k:'New to dialysis?',t:'Your first session, step by step',h:'#first'}},
    {id:'patients',label:'Patients & Visitors',intro:'Everything you need before, during and between sessions, for patients and the families who come with them.',all:['#first','All Patient Resources'],
     cols:[{h:'Plan your visit',l:[['#book','Book a Session'],['#first','Your First Session'],['#bring','What to Bring'],['#branches','Find a Branch']]},
           {h:'Billing & insurance',l:[['#faq-sha','SHA Cover'],['#insurers','Accepted Insurers'],['#faq-sha','Ways to Pay']]},
           {h:'Kidney life',l:[['#kidney-life','Fluids & Diet'],['#kidney-life','Work & Travel'],['#faq','Common Questions']]}],
     feat:{img:'assets/img/sm/ckswkddrone.jpg',k:'Our story in photos',t:'World Kidney Day 2025, through Ngong Town',h:'gallery.html#kidney-day'}}
  ];
  var LINKS=[['#branches','Branches'],['#about','About'],['gallery.html','Gallery']];
  var CHEV='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  var nav=document.querySelector('.header .nav'), drawer=document.getElementById('drawer'), header=document.querySelector('.header');
  if(!nav||!header)return;
  function cur(h){return h==='gallery.html'&&here==='gallery.html'?' aria-current="page"':''}
  nav.innerHTML=MENUS.map(function(m){return '<button type="button" class="nav-trigger" aria-expanded="false" aria-controls="mega-'+m.id+'" data-menu="'+m.id+'">'+esc(m.label)+CHEV+'</button>'}).join('')+
    LINKS.map(function(l){return '<a href="'+u(l[0])+'"'+cur(l[0])+'>'+esc(l[1])+'</a>'}).join('');
  var wrap=document.createElement('div');
  wrap.innerHTML=MENUS.map(function(m){
    return '<div class="mega" id="mega-'+m.id+'" hidden><div class="wrap mega-in">'+
      '<div class="mega-intro"><h2>'+esc(m.label)+'</h2><p>'+esc(m.intro)+'</p><a class="link" href="'+u(m.all[0])+'">'+esc(m.all[1])+'</a></div>'+
      '<div class="mega-cols">'+m.cols.map(function(c){return '<div><h3 class="caps">'+esc(c.h)+'</h3>'+c.l.map(function(l){return '<a href="'+u(l[0])+'">'+esc(l[1])+'</a>'}).join('')+'</div>'}).join('')+'</div>'+
      '<a class="mega-feat" href="'+u(m.feat.h)+'"><span class="ph"><img src="'+m.feat.img+'" alt="" loading="lazy"></span><span class="caps">'+esc(m.feat.k)+'</span><b>'+esc(m.feat.t)+'</b></a>'+
    '</div></div>';
  }).join('');
  while(wrap.firstChild)header.appendChild(wrap.firstChild);

  if(drawer){
    drawer.innerHTML=MENUS.map(function(m){return '<details class="d-group"><summary>'+esc(m.label)+CHEV+'</summary>'+m.cols.map(function(c){return '<p class="caps">'+esc(c.h)+'</p>'+c.l.map(function(l){return '<a href="'+u(l[0])+'">'+esc(l[1])+'</a>'}).join('')}).join('')+'</details>'}).join('')+
      LINKS.map(function(l){return '<a class="d-top" href="'+u(l[0])+'">'+esc(l[1])+'</a>'}).join('')+
      '<a class="btn btn-primary" href="'+u('#book')+'">Book a Session</a>';
    drawer.addEventListener('click',function(e){if(e.target.closest('a')){drawer.classList.remove('open');var mb=document.getElementById('menuBtn');if(mb)mb.setAttribute('aria-expanded','false')}});
  }

  var open=null, timer=null, fine=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  function show(id){
    if(open===id)return;
    hide(true);
    var t=nav.querySelector('[data-menu="'+id+'"]'), p=document.getElementById('mega-'+id);
    t.setAttribute('aria-expanded','true');p.hidden=false;requestAnimationFrame(function(){p.classList.add('on')});
    header.classList.add('mega-open');open=id;
  }
  function hide(quick){
    if(!open)return;
    var t=nav.querySelector('[data-menu="'+open+'"]'), p=document.getElementById('mega-'+open);
    t.setAttribute('aria-expanded','false');p.classList.remove('on');
    if(quick)p.hidden=true;else setTimeout(function(){if(!p.classList.contains('on'))p.hidden=true},220);
    header.classList.remove('mega-open');open=null;
  }
  nav.addEventListener('click',function(e){var t=e.target.closest('.nav-trigger');if(!t)return;open===t.dataset.menu?hide():show(t.dataset.menu)});
  if(fine){
    var leave=null;
    nav.addEventListener('mouseover',function(e){var t=e.target.closest('.nav-trigger');clearTimeout(timer);if(t)timer=setTimeout(function(){show(t.dataset.menu)},120);else if(e.target.closest('a'))timer=setTimeout(function(){hide()},120)});
    header.addEventListener('mouseleave',function(){clearTimeout(timer);clearTimeout(leave);leave=setTimeout(function(){hide()},260)});
    header.addEventListener('mouseenter',function(){clearTimeout(leave)});
  }
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open){var t=nav.querySelector('[data-menu="'+open+'"]');hide();t.focus()}});
  document.addEventListener('click',function(e){if(open&&!e.target.closest('.header'))hide()});
  header.addEventListener('click',function(e){if(e.target.closest('.mega a'))hide(true)});
  header.addEventListener('focusout',function(e){if(open&&e.relatedTarget&&!header.contains(e.relatedTarget))hide()});
  addEventListener('resize',function(){if(open&&innerWidth<=1100)hide(true)});
})();
