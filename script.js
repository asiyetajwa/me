(() => {
  'use strict';
  // Each tab list switches only its own panels (the moonshots and the theories each have one).
  document.querySelectorAll('[role="tablist"]').forEach(list => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const selectTab = (tab, focus = false) => {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); event.stopPropagation(); selectTab(tabs[next], true); }
      });
    });
  });

  // Section 3 carousel: two slides, moved by the arrows, the A/B labels, a swipe or the arrow keys; never on its own.
  const track = document.querySelector('.tc-track');
  if (track) {
    const slides = [...track.querySelectorAll('.tc-slide')];
    const picks = [...document.querySelectorAll('.tc-pick')];
    const arrows = [...document.querySelectorAll('.tc-arrow')];
    const count = document.querySelector('.tc-count');
    let current = -1;
    const show = index => {
      if (index === current) return;
      current = index;
      picks.forEach((pick, i) => pick.setAttribute('aria-current', String(i === index)));
      const focused = arrows.find(arrow => arrow === document.activeElement);
      arrows.forEach(arrow => { const to = index + Number(arrow.dataset.step); arrow.disabled = to < 0 || to >= slides.length; });
      // An arrow that just switched off hands focus to the one that still works.
      if (focused?.disabled) arrows.find(arrow => !arrow.disabled)?.focus();
      if (count) count.textContent = `${index + 1} / ${slides.length}`;
      slides.forEach((slide, i) => { slide.inert = i !== index; });
      track.style.height = `${slides[index].offsetHeight}px`;
    };
    const go = index => {
      const to = Math.max(0, Math.min(slides.length - 1, index));
      slides[to].inert = false;
      track.style.height = `${Math.max(slides[current].offsetHeight, slides[to].offsetHeight)}px`;
      track.scrollTo({ left: to * track.clientWidth });
    };
    picks.forEach(pick => pick.addEventListener('click', () => go(Number(pick.dataset.slide))));
    arrows.forEach(arrow => arrow.addEventListener('click', () => go(current + Number(arrow.dataset.step))));
    let settle;
    track.addEventListener('scroll', () => { clearTimeout(settle); settle = setTimeout(() => show(Math.round(track.scrollLeft / track.clientWidth)), 90); }, { passive: true });
    document.querySelector('.tc-nav').addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); go(current + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(current - 1); }
    });
    const fit = () => { track.style.height = `${slides[Math.max(current, 0)].offsetHeight}px`; };
    window.addEventListener('resize', () => { track.scrollLeft = Math.max(current, 0) * track.clientWidth; fit(); });
    // The track follows the shown slide's height as its tabs switch and its images load.
    if ('ResizeObserver' in window) { const watch = new ResizeObserver(fit); slides.forEach(slide => watch.observe(slide)); }
    document.fonts?.ready.then(fit);
    show(0);
  }

  const clock = document.getElementById('sf-time');
  const updateClock = () => {
    clock.textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) + ' SF LOCAL TIME';
  };
  updateClock();
  setInterval(updateClock, 60_000);
  document.getElementById('year').textContent = String(new Date().getFullYear());

  const copy = document.getElementById('copy-email');
  const status = document.getElementById('copy-status');
  let resetStatus;
  copy.addEventListener('click', async () => {
    clearTimeout(resetStatus);
    try {
      await navigator.clipboard.writeText('bw@circleplus.xyz');
      status.textContent = 'Email copied.';
    } catch {
      status.textContent = 'Select the address to copy, or open it to send an email.';
    }
    resetStatus = setTimeout(() => { status.textContent = ''; }, 6000);
  });

  const progress = document.querySelector('.reading-progress');
  let frame = false;
  const updateProgress = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${distance > 0 ? Math.min(100, Math.max(0, window.scrollY / distance * 100)) : 0}%`;
    frame = false;
  };
  window.addEventListener('scroll', () => { if (!frame) { frame = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
})();

