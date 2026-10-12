export const introTopics = [
  ['what-is-dpu', 'What is a DPU?'],
  ['inside', 'Inside the DPU'],
  ['modes', 'DPU mode vs NIC mode'],
  ['software', 'OS first, then containers'],
];
const groups = [
  ['01b', 'Manual DPU → HBN', '/manual-dpu', 'Simulated CLI'],
  ['01c', 'BF4 installation differences', '/manual-dpu#bf4-compatibility', 'BF3 vs BF4'],
  ['02', 'Kubernetes basics', '/kubernetes', 'Hands-on'],
  ['03', 'Prerequisites', null, 'Planned'],
  ['04', 'DPF operator', null, 'Planned'],
  ['05', 'DPU discovery', null, 'Planned'],
  ['06', 'Europe & Asia tenants', null, 'Planned'],
  ['07', 'DPU provisioning & configuration', '/dpu-config', 'YAML guide'],
  ['08', 'Host Ubuntu', '/host-ubuntu', 'Simulation'],
  ['09', 'HBN networking', null, 'Planned'],
  ['10', 'Validation & troubleshooting', null, 'Planned'],
];
const root = document.querySelector('[data-course-nav]');
if (root) {
  root.innerHTML = `<details id="course-menu" open><summary><span>COURSE CONTENTS</span><span class="menu-hint">Show / hide</span></summary><div class="catalog-body"><div class="catalog-title">DPF learning lab</div><p class="catalog-intro">From the card to the cluster.</p><div class="topic-heading"><span>01</span><b>DPU 101</b><small>5–7 min</small></div><nav id="chapters" aria-label="DPU 101 chapters">${introTopics.map(([id, label], i) => `<a href="/#${id}" data-chapter="${i}"><span class="topic-dot" aria-hidden="true"></span>${label}</a>`).join('')}</nav><nav class="course-topics" aria-label="All course topics">${groups.map(([n,title,href,status]) => href ? `<a href="${href}"><span class="topic-number">${n}</span><span>${title}<small>${status}</small></span></a>` : `<div class="planned-topic" aria-disabled="true"><span class="topic-number">${n}</span><span>${title}<small>${status}</small></span></div>`).join('')}</nav><p class="catalog-note">Prepared examples included.<br>Planned labs will be added here.</p></div></details>`;
  const menu = document.getElementById('course-menu');
  const summary = menu.querySelector('summary');
  const narrow = matchMedia('(max-width: 760px)');
  const syncMenu = () => {
    menu.open = !narrow.matches;
    summary.tabIndex = narrow.matches ? 0 : -1;
  };
  syncMenu();
  narrow.addEventListener('change', syncMenu);
  summary.addEventListener('click', event => {
    if (!narrow.matches) event.preventDefault();
  });
  root.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      const url = new URL(link.href);
      if (url.pathname === location.pathname && !url.hash && location.hash) {
        // Return from an in-page topic without discarding the lesson state.
        event.preventDefault();
        location.hash = '';
        window.scrollTo({top:0});
      }
    }
    if (event.target.closest('a') && narrow.matches) {
      menu.open = false;
      summary.focus({preventScroll: true});
    }
  });
  updateCourseNav();
  window.addEventListener('hashchange', updateCourseNav);
}
export function updateCourseNav() {
  if (!root) return;
  const activeHash = introTopics.some(([id]) => location.hash === `#${id}`) ? location.hash : '#what-is-dpu';
  const sectionMatch = [...root.querySelectorAll('a')].some(link => {
    const url = new URL(link.href);
    return url.pathname === location.pathname && url.hash && url.hash === location.hash;
  });
  for (const link of root.querySelectorAll('a')) {
    const url = new URL(link.href);
    const active = url.pathname === location.pathname && (url.pathname === '/' ? url.hash === activeHash : sectionMatch ? url.hash === location.hash : !url.hash);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
