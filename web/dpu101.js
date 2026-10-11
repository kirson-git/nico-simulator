import {introTopics, updateCourseNav} from './course-nav.js';
import {guideDiagram, mountGuideDiagrams} from './guide-diagrams.js';
const sources = {
  hardware: ['BlueField-4 specifications', 'https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform-six-new-chips-one-ai-supercomputer/'],
  overview: ['What is a DPU?', 'https://www.nvidia.com/en-us/networking/products/data-processing-unit/'],
  modes: ['BlueField operating modes', 'https://networking-docs.nvidia.com/doca/archive/3-5-0/bluefield-modes-of-operation'],
  bundles: ['Installing BlueField software', 'https://networking-docs.nvidia.com/bsp/4.16.0/deploying-bluefield-software-from-host'],
  hbn: ['HBN with DPF', 'https://networking-docs.nvidia.com/dpf/26.4.0/hbn-in-dpf-zero-trust'],
  dpf: ['DPF components', 'https://networking-docs.nvidia.com/dpf/26.4.0/component-description'],
};
const reading = (...keys) => `<div class="sources">NVIDIA reference: ${keys.map(key => `<a href="${sources[key][1]}" target="_blank" rel="noopener noreferrer">${sources[key][0]}</a>`).join(' · ')}</div>`;
const components = {
  'Arm CPUs': 'BlueField-4 has a 64-core NVIDIA Grace CPU using Arm Neoverse V2 cores. These run the DPU’s Linux OS and infrastructure software separately from the server CPU.',
  'DPU OS': 'Linux runs on the card’s Arm CPUs. You can connect to this OS separately from the host OS; DPU service containers run here.',
  'DPU BMC': 'On supported boards, the DPU has its own management controller for power and provisioning through Redfish. It is separate from the Arm Linux OS and from the server’s BMC / iDRAC.',
  'Memory & storage': 'BlueField-4 has 128 GB of LPDDR5X RAM for its OS and services. RAM is working memory; persistent OS storage is separate. Neither is the server’s RAM or its Ubuntu installation disk.',
  'Network engine': 'BlueField-4 integrates ConnectX-9 networking with up to 800 Gb/s throughput. Supported flows are forwarded in hardware; they do not all pass through an Arm CPU. Actual link speed depends on the platform, optics and network.',
  'Accelerators': 'Dedicated hardware helps with supported networking, security and storage tasks. The available features depend on the BlueField model and software.',
};
const modes = {
  'DPU mode': {owner: 'DPU Arm system controls networking', arm: 'Arm CPUs active · Linux running', text: 'The DPU runs its own infrastructure services and manages the host’s network path. Example: a networking service enforces the provider’s routing and traffic policy.'},
  'NIC mode': {owner: 'Host controls networking', arm: 'Arm services inactive in this comparison', text: 'The card acts as a ConnectX network adapter for the host. The host uses its network driver; DPU Arm Linux services and containers do not run in this mode.'},
};
const questions = [
  {text: 'Where do DPU service containers run?', choices: [['host','On the host OS'],['arm','On the DPU’s Arm Linux OS']], answer: 'arm', why: 'DPU containers run on the DPU OS. The server has a separate host OS.'},
  {text: 'Which mode uses the card as a host-controlled network adapter?', choices: [['nic','NIC mode'],['dpu','DPU mode']], answer: 'nic', why: 'NIC mode uses the card as a network adapter. DPU mode keeps the Arm system active.'},
];
const chapters = [
  {nav: 'What is a DPU?', title: 'A second computer inside your server.', html: `
    <p class="lead"><b>DPU</b> means <b>Data Processing Unit</b>. It connects a server to the network and can run networking, security and storage services on its own processors.</p>
    <div class="bf4-specs" aria-label="BlueField-4 published hardware specifications"><div><strong>64 <small>cores</small></strong><span>Grace CPU · Arm Neoverse V2</span></div><div><strong>128 <small>GB RAM</small></strong><span>Own LPDDR5X memory</span></div><div><strong>800 <small>Gb/s</small></strong><span>Up to · ConnectX-9 networking</span></div></div>
    <figure class="diagram reference-board"><img src="/images/dpu-board-photo.png" alt="Uploaded DPU board image showing its ports, chips, heatsink and PCIe connector."><figcaption class="image-note">Your original DPU board image. BlueField-4 specifications are shown above.</figcaption><a href="/images/dpu-board-photo.png" target="_blank" rel="noopener">Open full-size image ↗</a></figure>
    <div class="callout"><b>Remember:</b> installing Ubuntu on the server does not install the DPU’s OS. They are separate systems.</div>
    <p>The host runs the customer’s applications. The DPU runs infrastructure services on its own CPUs. A separate management connection can reach it without logging into the host.</p>${reading('overview','hardware')}`},
  {nav: 'Inside the DPU', title: 'Its own CPU, OS, memory and management.', html: `
    <p class="lead">The DPU has its own OS, processors and memory. Here are the original diagrams.</p>
    <div class="switcher board-view-switcher" role="group" aria-label="DPU diagram views"><button data-board-view="board" aria-pressed="true">Your board diagram</button><button data-board-view="paths" aria-pressed="false">Host + DPU paths</button></div>
    <figure class="diagram reference-board" data-board-panel="board"><img src="/images/dpu-board-reference-1.png" alt="Original DPU board illustration with management and network ports, Arm cores, Ubuntu, DOCA and applications."><figcaption class="image-note">Original PNG, unchanged. Its Ubuntu 22.04 label and 16-core drawing are from the source illustration; BlueField-4 has 64 Arm cores and 128 GB RAM.</figcaption><a href="/images/dpu-board-reference-1.png" target="_blank" rel="noopener">Open full-size image ↗</a></figure>
    <figure class="diagram reference-board" data-board-panel="paths" hidden><img src="/images/dpu-board-reference-2.png" alt="Original diagram showing host virtual machines and pods connected to a DPU with OVS-DOCA, Ubuntu, Arm cores and applications."><figcaption class="small">Host workloads above; DPU infrastructure below. Supported flows can be offloaded to network hardware.</figcaption><a href="/images/dpu-board-reference-2.png" target="_blank" rel="noopener">Open full-size image ↗</a></figure>
    <details><summary>Explore the components</summary><div class="switcher">${Object.keys(components).map(name => `<button data-component="${name}">${name}</button>`).join('')}</div><div id="component-detail" class="detail" aria-live="polite"></div></details>
    <div class="callout"><b>Arm CPUs run the software.</b> Networking hardware forwards and accelerates supported traffic. Every packet does not need to pass through an Arm CPU.</div>
    <details><summary>Optional: firmware and the management controller</summary><p>Firmware starts the device and operates its hardware. The Linux OS runs above that foundation. Supported cards also have a BMC: a separate management controller used for tasks such as power and remote provisioning. The BMC is not the DPU’s Linux OS.</p></details>${reading('hardware')}`},
  {nav: 'DPU mode vs NIC mode', title: 'Who controls the network card?', html: `
    <p class="lead">Two networking roles: DPU-managed infrastructure or a host-controlled NIC. Follow the control owner and the packet.</p>
    <div class="switcher" role="group" aria-label="Mode diagram view"><button data-mode-view="comparison" aria-pressed="true">Animated comparison</button><button data-mode-view="original" aria-pressed="false">Original PNG animation</button></div>
    <div data-mode-panel="comparison">${guideDiagram('modes')}</div>
    <div data-mode-panel="original" hidden>
    <div class="diagram mode-diagram photo-mode-diagram">
      <div id="mode-photo" data-mode="dpu" data-original="false">
        <img src="/images/dpu-board-reference-2.png" alt="Exact uploaded host-and-DPU PNG. Mode overlays identify the active network owner; captions below explain the selected mode.">
        <div class="switcher photo-mode-controls" role="group" aria-label="Mode on the diagram">${Object.keys(modes).map(name => `<button data-mode="${name}">${name}</button>`).join('')}</div>
        <div class="playback-controls photo-playback" role="group" aria-label="Packet playback"><button id="packet-play" class="primary" aria-label="Play packet">▶ Play</button><button id="packet-next" aria-label="Next packet step" title="Next packet step">→</button><button id="packet-replay" aria-label="Replay packet" title="Replay packet">↺</button></div>
        <div id="mode-host" class="photo-overlay photo-host" data-active="false" aria-hidden="true"></div>
        <div id="mode-arm" class="photo-overlay photo-arm" data-active="true" aria-hidden="true"><span class="arm-off-label">Arm OS + apps<br>inactive in NIC mode</span></div>
        <svg class="photo-overlay photo-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="dpu-route" d="M53 17 V63 H59 V72 H26"/><path class="nic-route" d="M38 17 V42 H33 V72 H26"/></svg>
        <div class="photo-overlay photo-owner-label" id="photo-owner-label"></div>
        <div class="photo-overlay photo-packet" id="packet-track" aria-hidden="true"><div class="packet-token-wrap"><div class="packet-token"><span id="packet-wrapper" hidden>VXLAN · 10100</span><span>packet</span></div></div></div>
      </div>
      <div class="photo-options"><label><input id="photo-original" type="checkbox">Show original PNG</label><a href="/images/dpu-board-reference-2.png" target="_blank" rel="noopener">Open full-size image ↗</a></div>
      <h3 id="mode-owner"></h3><div id="mode-detail" class="detail" aria-live="polite"></div>
      <p class="small photo-role-summary"><span id="host-role"></span> · <span id="arm-role"></span></p>
      <p class="small"><span id="packet-action"></span> · <span id="packet-result"></span></p>
      <div class="packet-explanation"><span id="packet-stage"></span><p id="packet-caption" aria-live="polite"></p></div>
      <label class="hbn-example"><input id="hbn-example" type="checkbox">Show configured HBN example</label>
      <p id="packet-note" class="small" aria-live="polite"></p>
    </div>
    </div>
    <div class="callout"><b>For this DPF lab, we use DPU mode:</b> the Arm OS stays active so we can deploy services there.</div>
    <details><summary>Optional: Zero Trust and passthrough</summary><p><b>Zero Trust</b> restricts host access to the DPU while its Arm OS stays active. It is a restricted form of DPU mode.</p><p>A <b>passthrough service</b> forwards traffic; it does not switch the device into NIC mode. The cited mode guide documents BlueField-2/3 behavior. This animation teaches control ownership; it is not a BlueField-4 mode-switch procedure or a statement that every SKU supports both modes.</p></details>
    <p class="small">These buttons change the explanation only.</p>${reading('modes','hbn')}`},
  {nav: 'OS first, then containers', title: 'Install the DPU OS. Then add services.', html: `
    <p class="lead">In DPU mode, containers need a running Arm Linux system underneath them.</p>
    ${guideDiagram('software')}
    <p><b>DOCA</b> is NVIDIA’s software platform for DPU services; it runs with Linux. In DPF, the DPU joins a Kubernetes cluster before service pods run on it.</p>
    <p><b>HBN</b> means Host-Based Networking. It is a service container on the DPU, despite “host” in the name. Installing the DPU OS alone does not deploy or configure HBN.</p>
    <div class="callout"><b>DPF is the orchestrator:</b> its management controllers coordinate DPU provisioning and service deployment. This introduction explains the sequence; it does not install anything.</div>
    <details><summary>Quick check (optional)</summary><form id="quiz">${questions.map((q, i) => `<fieldset><legend>${q.text}</legend>${q.choices.map(([value, label]) => `<label><input type="radio" name="q${i}" value="${value}">${label}</label>`).join('')}</fieldset>`).join('')}<div class="switcher"><button type="submit" class="primary">Check answers</button><button type="reset">Try again</button></div></form><div id="quiz-result" class="feedback" aria-live="polite">Choose an answer for each question.</div></details>
    <details><summary>Optional: where tenants fit</summary><p>Europe and Asia are our example tenants. Later labs explain DPU assignment, separate control planes and network policies. Tenant names and namespaces alone do not enforce isolation.</p></details>
    <div class="next-lesson"><h3>What comes next?</h3><p><b>Kubernetes basics → DPF setup → DPU provisioning → host Ubuntu → HBN services.</b></p><p class="small">Kubernetes basics, the DPU configuration YAML guide and the host Ubuntu rehearsal are available. DPF setup, DPU provisioning and HBN exercises are planned.</p><a class="next-link" href="/kubernetes">Continue to Kubernetes basics →</a><p class="small">Already know the foundations? <a href="/host-ubuntu">Open the later host Ubuntu rehearsal</a>.</p></div>
    ${reading('bundles','dpf','hbn')}`},
];
let active = 0;
let disposeChapter = () => {};
const nav = document.getElementById('chapters');
function navigate(index) {
  const hash = `#${introTopics[index][0]}`;
  if (location.hash === hash) showChapter(index);
  else location.hash = hash;
}
function fromHash() {
  const index = introTopics.findIndex(([id]) => location.hash === `#${id}`);
  showChapter(index < 0 ? 0 : index);
}
function select(buttons, selected) {
  for (const button of buttons) button.setAttribute('aria-pressed', String(button === selected));
}
function showChapter(index) {
  disposeChapter();
  disposeChapter = () => {};
  active = index;
  updateCourseNav();
  document.getElementById('counter').textContent = `DPU 101 / ${String(index + 1).padStart(2, "0")} · ${chapters[index].nav}`;
  document.getElementById('chapter').innerHTML = `<h2 tabindex="-1">${chapters[index].title}</h2>${chapters[index].html}`;
  const componentButtons = document.querySelectorAll('[data-component]');
  for (const button of componentButtons) button.onclick = () => {
    select(componentButtons, button);
    document.getElementById('component-detail').textContent = components[button.dataset.component];
  };
  componentButtons[0]?.click();
  const boardViews = document.querySelectorAll('[data-board-view]');
  for (const button of boardViews) button.onclick = () => {
    select(boardViews, button);
    for (const panel of document.querySelectorAll('[data-board-panel]')) panel.hidden = panel.dataset.boardPanel !== button.dataset.boardView;
  };
  const modeButtons = document.querySelectorAll('button[data-mode]');
  const hbnExample = document.getElementById('hbn-example');
  let selectedMode = 'DPU mode';
  let packetStep = 0;
  let playing = false;
  let frame = null;
  let progress = 0;
  let lastTick = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function stopPlayback() {
    cancelAnimationFrame(frame);
    frame = null;
    lastTick = null;
    playing = false;
  }
  function positionPacket() {
    const dpu = selectedMode === 'DPU mode';
    // Timed waypoints follow the right-angle routes drawn over the original PNG.
    // Hold at the DPU so the added VXLAN wrapper is readable before egress.
    const route = dpu
      ? [[0,53,17],[.12,53,17],[.40,53,63],[.44,59,63],[.50,59,72],[.65,59,72],[.95,26,72],[1,26,72]]
      : [[0,38,17],[.12,38,17],[.26,38,42],[.30,33,42],[.50,33,72],[.65,33,72],[.95,26,72],[1,26,72]];
    let x, y;
    if (reducedMotion.matches) {
      [,x,y] = route[packetStep === 0 ? 0 : packetStep === 1 ? 4 : 7];
    } else {
      const i = Math.max(1, route.findIndex(point => point[0] >= progress));
      const from = route[i - 1], to = route[i];
      const fraction = (progress - from[0]) / (to[0] - from[0]);
      x = from[1] + (to[1] - from[1]) * fraction;
      y = from[2] + (to[2] - from[2]) * fraction;
    }
    const track = document.getElementById('packet-track');
    track.style.setProperty('--packet-x', `${x}%`);
    track.style.setProperty('--packet-y', `${y}%`);
  }
  function renderPacket() {
    const dpu = selectedMode === 'DPU mode';
    const hbn = dpu && hbnExample.checked;
    const captions = [
      'The host application creates a packet. It passes from the host OS to the BlueField card over PCIe.',
      hbn ? 'In this configured HBN example, the DPU adds a VXLAN wrapper with Europe’s illustrative VNI 10100. The original packet remains inside.'
        : dpu ? 'The DPU’s Arm software sets the forwarding rules. Supported flows run in the network hardware; each packet does not need the Arm CPU.'
        : 'The host driver controls the adapter. BlueField forwards using those settings and supported offloads; its Arm Linux system is inactive.',
      hbn ? 'The wrapped packet leaves for the network. The remote overlay endpoint uses the VNI to identify the tenant network.'
        : 'The packet leaves through the network port. Its treatment follows the configured rules; DPU mode alone does not add an overlay.',
    ];
    const track = document.getElementById('packet-track');
    positionPacket();
    track.dataset.step = String(packetStep);
    track.dataset.playing = String(playing);
    document.getElementById('packet-wrapper').hidden = !(hbn && packetStep > 0);
    document.getElementById('packet-stage').textContent = `${packetStep + 1} / 3 · ${['HOST', 'BLUEFIELD', 'NETWORK'][packetStep]}`;
    document.getElementById('packet-caption').textContent = captions[packetStep];
    document.getElementById('packet-play').textContent = playing ? 'Ⅱ Pause' : '▶ Play';
    document.getElementById('packet-play').setAttribute('aria-label', playing ? 'Pause packet' : 'Play packet');
    document.getElementById('packet-next').disabled = packetStep === 2;
    for (const node of document.querySelectorAll('[data-packet-node]')) node.dataset.current = String(Number(node.dataset.packetNode) === packetStep);
  }
  function tick(timestamp) {
    if (!playing) return;
    if (lastTick !== null) progress = Math.min(1, progress + (timestamp - lastTick) / 6000);
    lastTick = timestamp;
    const step = progress < .50 ? 0 : progress < .95 ? 1 : 2;
    positionPacket();
    if (step !== packetStep) { packetStep = step; renderPacket(); }
    if (progress === 1) { stopPlayback(); renderPacket(); }
    else frame = requestAnimationFrame(tick);
  }
  function showModeOverlays() {
    document.getElementById('photo-original').checked = false;
    document.getElementById('mode-photo').dataset.original = 'false';
  }
  function resetPacket() {
    stopPlayback();
    packetStep = 0;
    progress = 0;
    renderPacket();
  }
  function renderMode() {
    const dpu = selectedMode === 'DPU mode';
    const mode = modes[selectedMode];
    const hbn = dpu && hbnExample.checked;
    document.getElementById('mode-photo').dataset.mode = dpu ? 'dpu' : 'nic';
    document.getElementById('photo-owner-label').textContent = dpu ? 'DPU controls networking · Arm OS + services active' : 'Host controls networking · NIC hardware forwards';
    document.getElementById('mode-owner').textContent = mode.owner;
    document.getElementById('mode-detail').innerHTML = `<strong>${mode.arm}</strong><p>${mode.text}</p>`;
    document.getElementById('mode-host').dataset.active = String(!dpu);
    document.getElementById('mode-arm').dataset.active = String(dpu);
    document.getElementById('host-role').textContent = dpu ? 'Runs customer applications' : 'Controls the network adapter';
    document.getElementById('arm-role').textContent = dpu ? 'Runs Linux and infrastructure services' : 'No Arm services in this comparison';
    document.getElementById('packet-action').textContent = hbn ? 'Configured HBN adds a VXLAN wrapper' : dpu ? 'Applies configured forwarding rules' : 'Forwards using host-controlled settings';
    document.getElementById('packet-result').textContent = hbn ? 'VXLAN · VNI 10100 + original packet' : 'Packet follows the configured network path';
    document.getElementById('packet-note').textContent = hbn
      ? 'Teaching example: HBN is configured for a Europe overlay. VNI 10100 is an illustrative network ID. Isolation also needs access policies; mode selection alone does not create it.'
      : dpu ? 'DPU mode does not automatically add VXLAN. Enable the example to see what a configured service can add. Supported packet flows can be offloaded to hardware.'
      : 'NIC mode still supports hardware offloads. Encapsulation depends on host and NIC configuration; it is not automatically absent.';
    hbnExample.disabled = !dpu;
    resetPacket();
  }
  for (const button of modeButtons) button.onclick = () => {
    select(modeButtons, button);
    selectedMode = button.dataset.mode;
    showModeOverlays();
    hbnExample.checked = selectedMode === 'DPU mode';
    renderMode();
  };
  if (hbnExample) {
    document.getElementById('photo-original').onchange = event => {
      document.getElementById('mode-photo').dataset.original = String(event.target.checked);
      stopPlayback();
      renderPacket();
    };
    hbnExample.onchange = renderMode;
    document.getElementById('packet-play').onclick = () => {
      if (playing) stopPlayback();
      else {
        showModeOverlays();
        if (packetStep === 2) { packetStep = 0; progress = 0; }
        playing = true;
        frame = requestAnimationFrame(tick);
      }
      renderPacket();
    };
    document.getElementById('packet-next').onclick = () => {
      stopPlayback();
      showModeOverlays();
      packetStep = Math.min(packetStep + 1, 2);
      progress = packetStep === 1 ? .50 : 1;
      renderPacket();
    };
    document.getElementById('packet-replay').onclick = resetPacket;
    const hidePlayback = () => { if (document.hidden) { stopPlayback(); renderPacket(); } };
    document.addEventListener('visibilitychange', hidePlayback);
    disposeChapter = () => { stopPlayback(); document.removeEventListener('visibilitychange', hidePlayback); };
  }
  modeButtons[0]?.click();
  const guide = mountGuideDiagrams(document.getElementById('chapter'));
  const disposePacket = disposeChapter;
  disposeChapter = () => { disposePacket(); guide.dispose(); };
  const modeViews = document.querySelectorAll('[data-mode-view]');
  for (const button of modeViews) button.onclick = () => {
    stopPlayback();
    if (hbnExample) renderPacket();
    guide.pause();
    select(modeViews, button);
    for (const panel of document.querySelectorAll('[data-mode-panel]')) panel.hidden = panel.dataset.modePanel !== button.dataset.modeView;
  };
  const quiz = document.getElementById('quiz');
  if (quiz) {
    quiz.onsubmit = event => {
      event.preventDefault();
      const values = new FormData(quiz);
      const checks = questions.map((q, i) => values.get(`q${i}`) === q.answer);
      const count = checks.filter(Boolean).length;
      const passed = count === questions.length;
      document.getElementById('quiz-result').innerHTML = `<strong class="${passed ? 'pass' : 'retry'}">${count} of ${questions.length} correct${passed ? ' — DPU 101 complete!' : ' — review and try again.'}</strong><ul>${questions.map((q, i) => `<li>${checks[i] ? '✓' : '○'} ${q.why}</li>`).join('')}</ul>`;
    };
    quiz.onreset = () => { document.getElementById('quiz-result').textContent = 'Choose an answer for each question.'; };
  }
  document.getElementById('previous').disabled = index === 0;
  document.getElementById('next').disabled = index === chapters.length - 1;
  document.getElementById('chapter').querySelector('h2').focus({preventScroll: true});
  window.scrollTo({top: 0, behavior: 'instant'});
}
document.getElementById('previous').onclick = () => navigate(active - 1);
document.getElementById('next').onclick = () => navigate(active + 1);
window.addEventListener('hashchange', fromHash);
fromHash();
