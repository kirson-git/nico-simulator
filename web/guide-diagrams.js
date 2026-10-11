// The l-csi guide's visual grammar: colored domains, labeled arrows and SVG motion.
// Course concepts only; these diagrams do not represent live deployment status.
const descriptions = {
  modes: [
    'Who sets the rules? In NIC mode, the host controls the adapter. In DPU mode, the Arm OS runs the infrastructure software and controls the network engine.',
    'Follow the packet: the host sends it over PCIe to the network hardware. Supported flows are handled in hardware; every packet does not need to visit an Arm CPU.',
    'The packet leaves the port. On the right, our configured HBN example adds VXLAN. That wrapper comes from service configuration, not simply from selecting DPU mode.',
  ],
  software: [
    'DPF coordinates provisioning through the DPU BMC. A full BFB bundle supplies the Arm OS, DOCA software and firmware for the supported lab profile.',
    'The DPU boots its own Arm Linux system. This is a separate OS from Ubuntu on the host server.',
    'The DPU joins its tenant Kubernetes cluster as a worker. In this lab, Kamaji runs that cluster’s API server on the management cluster.',
    'Only after the OS and cluster are ready can DPF deploy service containers onto the DPU. HBN is one example; it still needs its own configuration.',
  ],
};
const headings = {modes: 'Same card. Different control owner.', software: 'From a bare DPU to running services'};
const stageNames = {modes: ['Control ownership', 'Hardware forwarding', 'Out to the network'], software: ['Provision', 'Boot the OS', 'Join the cluster', 'Deploy services']};
const label = (x, y, text, cls = 'gd-text', anchor = 'middle') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${text}</text>`;
const box = (x, y, w, h, title, sub, cls = '') => `<g class="gd-box ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>${label(x+w/2, y+28, title)}${sub ? label(x+w/2, y+51, sub, 'gd-small') : ''}</g>`;
const badge = (x,y,n) => `<circle cx="${x}" cy="${y}" r="14" class="gd-number"/>${label(x,y+6,n,'gd-number-text')}`;
const arrow = (path, cls = '', marker = 'gd-arrow') => `<path d="${path}" class="gd-arrow-line ${cls}" marker-end="url(#${marker})"/>`;
const defs = id => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="gd-arrow-head"/></marker></defs>`;

function modeDrawing() {
  const column = (offset, dpu) => `<g transform="translate(${offset} 0)">
    <rect x="12" y="14" width="448" height="420" rx="12" class="gd-lane ${dpu ? 'gd-dpu' : 'gd-management'}"/>
    ${label(32, 44, dpu ? 'DPU MODE' : 'NIC MODE', 'gd-lane-title', 'start')}
    ${box(32,64,408,66,'Host OS + applications',dpu ? 'Runs the customer workloads' : 'Host driver owns the network settings','gd-host')}
    <rect x="32" y="168" width="408" height="245" rx="10" class="gd-card"/>
    ${label(150,196,'BLUEFIELD CARD','gd-small','start')}
    ${box(52,230,166,68,'Network engine','Hardware forwarding','gd-hardware')}
    ${box(244,230,176,68,'Arm OS + services',dpu ? 'Sets the rules' : 'Inactive in this example',dpu ? 'gd-owner' : 'gd-inactive')}
    ${box(52,345,166,53,'Network port','','gd-port')}
    ${arrow('M82 130 V228','gd-packet-route','gd-mode-arrow')}
    ${arrow('M82 298 V343','gd-packet-route','gd-mode-arrow')}
    ${label(100,153,'PCIe','gd-small','start')}
    ${dpu ? arrow('M332 230 V212 H196 V228','gd-control','gd-mode-arrow') : arrow('M332 130 V210 H196 V228','gd-control','gd-mode-arrow')}
    ${badge(332,dpu ? 212 : 176,'1')}
    ${badge(82,210,'2')}
    ${badge(82,323,'3')}
    <circle r="7" class="gd-packet">
      <animateMotion dur="9s" repeatCount="indefinite" path="M82 130 V369" keyPoints="0;0;.58;.58;1;1" keyTimes="0;.30;.50;.66;.92;1" calcMode="linear"/>
    </circle>
    ${dpu ? `<g class="gd-vxlan"><rect x="242" y="342" width="180" height="56" rx="8"/>${label(332,365,'VXLAN · VNI 10100','gd-text')}${label(332,387,'Configured HBN example','gd-small')}
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.64;.66;1" dur="9s" repeatCount="indefinite" calcMode="discrete"/>
    </g>` : label(332,372,'Host-controlled forwarding','gd-small')}
  </g>`;
  return `<svg viewBox="0 0 960 448" role="img" aria-label="NIC and DPU mode side by side: host or Arm software sets the rules; packets use the hardware network engine and port. The DPU example shows configured HBN VXLAN.">
    ${defs('gd-mode-arrow')}${column(0,false)}${column(480,true)}
  </svg>`;
}

function softwareDrawing() {
  return `<svg viewBox="0 0 960 418" role="img" aria-label="Four stages: DPF provisions through the BMC, the DPU boots Arm Linux, it joins the tenant cluster, and DPF deploys service containers.">
    ${defs('gd-software-arrow')}
    <rect x="16" y="16" width="274" height="380" rx="12" class="gd-lane gd-management"/>
    <rect x="326" y="16" width="618" height="380" rx="12" class="gd-lane gd-dpu"/>
    ${label(36,48,'MANAGEMENT CLUSTER','gd-lane-title','start')}
    ${label(346,48,'DPU · ITS OWN COMPUTER','gd-lane-title','start')}
    ${box(36,87,234,78,'DPF operator','Coordinates provisioning','gd-host')}
    ${box(36,282,234,78,'Tenant Kubernetes API','Hosted by Kamaji','gd-tenant')}
    ${box(346,87,196,78,'DPU BMC','Remote provisioning','gd-hardware')}
    ${box(644,87,280,78,'Arm Linux + DOCA','Installed from the BFB','gd-os')}
    ${box(644,282,280,78,'Service containers','Example: configured HBN','gd-services')}
    ${arrow('M270 126 H344','','gd-software-arrow')}
    ${arrow('M542 126 H642','','gd-software-arrow')}
    ${arrow('M784 165 V220 H153 V280','gd-join','gd-software-arrow')}
    ${arrow('M270 320 H642','','gd-software-arrow')}
    ${badge(306,104,'1')}${badge(592,104,'2')}${badge(484,220,'3')}${badge(484,320,'4')}
    ${label(592,157,'Boot','gd-small')}${label(446,205,'Worker joins its cluster','gd-small')}
    ${label(450,357,'Deploy after the OS is ready','gd-small')}
    <circle r="7" class="gd-token"><animateMotion dur="12s" repeatCount="indefinite" path="M270 126 H344" keyPoints="0;1;1" keyTimes="0;.24;1" calcMode="linear"/><animate attributeName="opacity" values="1;0;0;0" keyTimes="0;.25;.5;.75" dur="12s" calcMode="discrete" repeatCount="indefinite"/></circle>
    <circle r="7" class="gd-token"><animateMotion dur="12s" repeatCount="indefinite" path="M542 126 H642" keyPoints="0;0;1;1" keyTimes="0;.25;.49;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.25;.5;.75" dur="12s" calcMode="discrete" repeatCount="indefinite"/></circle>
    <circle r="7" class="gd-token"><animateMotion dur="12s" repeatCount="indefinite" path="M784 165 V220 H153 V280" keyPoints="0;0;1;1" keyTimes="0;.5;.74;1" calcMode="linear"/><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;.25;.5;.75" dur="12s" calcMode="discrete" repeatCount="indefinite"/></circle>
    <circle r="7" class="gd-token"><animateMotion dur="12s" repeatCount="indefinite" path="M270 320 H642" keyPoints="0;0;1" keyTimes="0;.75;1" calcMode="linear"/><animate attributeName="opacity" values="0;0;0;1" keyTimes="0;.25;.5;.75" dur="12s" calcMode="discrete" repeatCount="indefinite"/></circle>
  </svg>`;
}

export function guideDiagram(kind) {
  return `<figure class="guide-diagram" data-guide-diagram="${kind}" data-step="0">
    <div class="gd-toolbar"><span class="gd-heading">${headings[kind]}</span><div class="gd-controls" role="group" aria-label="Diagram animation">
      <button type="button" data-guide-play aria-label="Play animation">▶ Play</button>
      <button type="button" data-guide-next aria-label="Next step">Step →</button>
      <button type="button" data-guide-replay aria-label="Replay animation">↺</button>
    </div></div>
    <div class="gd-legend"><span class="gd-legend-host">Host / management</span><span class="gd-legend-dpu">DPU infrastructure</span><span class="gd-legend-flow">${kind === 'modes' ? 'Moving packet' : 'Provisioning step'}</span></div>
    <div class="gd-scroll" role="region" tabindex="0" aria-label="${headings[kind]} diagram; scroll horizontally on small screens">${kind === 'modes' ? modeDrawing() : softwareDrawing()}</div>
    <p class="gd-scroll-hint">Swipe the diagram sideways to explore it. Keyboard: focus it and use the arrow keys.</p>
    <figcaption><strong data-guide-step></strong><p data-guide-caption aria-live="polite"></p></figcaption>
  </figure>`;
}

export function mountGuideDiagrams(root) {
  const controllers = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  for (const figure of root.querySelectorAll('[data-guide-diagram]')) {
    const kind = figure.dataset.guideDiagram, svg = figure.querySelector('svg');
    const total = descriptions[kind].length, duration = total * 3;
    const play = figure.querySelector('[data-guide-play]');
    let playing = false, frame = null, step = -1;
    svg.pauseAnimations(); svg.setCurrentTime(0);
    const render = () => {
      const current = Math.floor((svg.getCurrentTime() % duration) / 3);
      if (current !== step) {
        step = current;
        figure.dataset.step = String(step);
        figure.querySelector('[data-guide-step]').textContent = `${step+1} / ${total} · ${stageNames[kind][step]}`;
        figure.querySelector('[data-guide-caption]').textContent = descriptions[kind][step];
      }
    };
    const pause = () => {
      playing = false; svg.pauseAnimations(); cancelAnimationFrame(frame); frame = null;
      play.textContent = '▶ Play'; play.setAttribute('aria-label', 'Play animation');
    };
    const tick = () => {if (playing) {render(); frame = requestAnimationFrame(tick);}};
    play.onclick = () => {
      if (playing) pause();
      else if (reduced.matches) {svg.setCurrentTime(((step+1) % total)*3); render();}
      else {playing = true; svg.unpauseAnimations(); play.textContent = 'Ⅱ Pause'; play.setAttribute('aria-label','Pause animation'); tick();}
    };
    figure.querySelector('[data-guide-next]').onclick = () => {pause(); svg.setCurrentTime(((step+1) % total)*3); render();};
    figure.querySelector('[data-guide-replay]').onclick = () => {pause(); svg.setCurrentTime(0); render();};
    render(); controllers.push({pause});
  }
  const pause = () => controllers.forEach(c => c.pause());
  const visibility = () => {if (document.hidden) pause();};
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', pause);
  return {pause, dispose() {pause(); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', pause);}};
}
