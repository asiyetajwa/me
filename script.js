(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('[role="tab"]')];
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
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });

  const clock = document.getElementById('sf-time');
  const updateClock = () => {
    clock.textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) + ' LOCAL TIME';
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
      await navigator.clipboard.writeText('bw@thebsc.info');
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
