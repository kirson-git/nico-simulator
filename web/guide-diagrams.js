// The l-csi guide's visual grammar: colored domains, labeled arrows and SVG motion.
// Course concepts only; these diagrams do not represent live deployment status.
const descriptions = {
  fleet: [
    'Change the DPUDeployment service configuration reference in the management API. The BFB, flavor, template and both telemetry profiles already exist. This is simulated intent.',
    'Match inventory labels: fleet=east on DPUNodes and managed=true on DPUDevices. Rack 01 and Rack 02 are selected; Rack 03 is outside the selection. The DPUCluster label selects infra-east.',
    'Controllers reconcile the referenced service configuration onto provisioned DPU workers. Updates follow their configured policies; this is not a simultaneous all-rack transaction.',
    'Review controller conditions and verify telemetry at the collector. An unavailable DPU or failed service requires investigation. No live success or scale benchmark is claimed here.',
  ],
  tenants: [
    'The operator uses DPF to deliver the HBN service and its prepared configuration. Management access is separate from customer traffic and protected by identity, RBAC and host restrictions.',
    'Europe traffic follows its assigned interfaces, VRF and VXLAN VNI across the fabric to another Europe rack. HBN configures hardware forwarding; packets do not traverse DPF.',
    'Asia uses a separate interface assignment, VRF and VNI. Configure fabric routing and route-target policy consistently at both ends.',
    'The intended negative test: Europe cannot reach Asia without explicitly authorized connectivity. Verify this with real traffic. Separate storage, compute-fabric and GPU controls must also enforce tenant ownership.',
  ],
  rollout: [
    'Declare the selected DPUs, service templates and configuration through the management Kubernetes API. This is authored playback, not a live deployment.',
    'Controllers resolve the declared dependencies. In the documented architecture, the service controller uses Argo CD to synchronize chart-based workloads; container images come from a registry.',
    'The DPU cluster schedules service containers on selected, provisioned DPU workers. Placement and network configuration must match the chosen service.',
    'Inspect reported conditions and test the intended outcome. A running pod does not prove working routing, security detection or storage access.',
  ],
  servicePaths: [
    'Networking example: HBN configures forwarding. Supported host traffic uses the DPU network engine on the way to the fabric; it does not traverse DPF controllers.',
    'Security example: Argus on the DPU inspects host memory using hardware access. This is a separate inspection path, not a packet service chain.',
    'Argus produces security events for collection and analysis. Detection and export need configuration; this animation does not claim a threat was observed.',
  ],
  manual: [
    'What is a DPU? The card has an Arm computer and network hardware. First inspect its mode. HBN requires the Arm environment; an installed OS can remain on storage while NIC mode makes Arm unavailable.',
    'Install the Arm OS: the trusted host pushes a BFB through RShim in this manual example. This is a provisioning path, not the application data path. It must happen before disabling host RShim.',
    'Start and configure HBN: the service runs in a container on Arm Linux and programs networking. Supported traffic can forward in hardware. The solid line shows the illustrative host-to-fabric data path.',
    'Restrict the host: the host RShim path is now blocked in our final scenario. Keep independent management through the BMC and the authorized Arm administration path. This does not imply all host data packets are blocked.',
  ],
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
const headings = {fleet: 'One intent → selected racks → verified outcome', tenants: 'Two tenants across four reserved racks', rollout: 'From declared intent to service pods', servicePaths: 'Two services. Two different jobs.', manual: 'Host, DPU and network: who does what?', modes: 'Same card. Different control owner.', software: 'From a bare DPU to running services'};
const stageNames = {fleet: ['Change the profile', 'Select the fleet', 'Reconcile the service', 'Verify and investigate'], tenants: ['Deliver configuration', 'Europe to Europe', 'Asia to Asia', 'Test the tenant boundary'], rollout: ['Declare', 'Resolve and synchronize', 'Deploy on selected DPUs', 'Verify the outcome'], servicePaths: ['Forward traffic', 'Inspect memory', 'Export security events'], manual: ['Identify the systems', 'Install the BFB', 'Run HBN and forward', 'Restrict and retain management'], modes: ['Control ownership', 'Hardware forwarding', 'Out to the network'], software: ['Provision', 'Boot the OS', 'Join the cluster', 'Deploy services']};
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

function manualDrawing() {
  return `<svg viewBox="0 0 940 470" role="img" aria-label="The host pushes a BFB to the DPU Arm OS before restriction. HBN programs the network engine. Host traffic forwards to the fabric. The management machine reaches a separate DPU BMC.">
    ${defs('gd-manual-arrow')}
    <rect x="320" y="12" width="378" height="434" rx="14" class="gd-lane gd-dpu"/>
    ${label(510,38,'BLUEFIELD DPU','gd-lane-title')}
    ${box(20,58,244,72,'Management machine','Independent admin network','gd-host')}
    ${box(340,58,338,72,'DPU BMC','Management controller','gd-host')}
    ${box(340,158,338,64,'Arm Linux OS','Separate CPU, memory and OS','gd-os')}
    ${box(340,247,338,64,'HBN container','Services configure networking','gd-services')}
    ${box(340,356,338,65,'Network engine','Hardware forwarding','gd-hardware')}
    ${box(20,350,244,78,'Host server','Host OS + applications','gd-host')}
    ${box(752,350,168,78,'Network fabric','Test peer','gd-tenant')}
    ${arrow('M264 93 H338','gd-control','gd-manual-arrow')}
    ${arrow('M510 130 V156','gd-control','gd-manual-arrow')}
    <g class="gd-manual-rshim">${arrow('M140 349 V190 H338','gd-control','gd-manual-arrow')}
      ${label(166,240,'BFB over RShim','gd-small','start')}
      ${label(166,263,'before restriction','gd-small','start')}</g>
    ${arrow('M510 222 V245','gd-control','gd-manual-arrow')}
    ${arrow('M510 311 V353','gd-control','gd-manual-arrow')}
    ${label(527,338,'Programs rules','gd-small','start')}
    ${arrow('M264 387 H337','gd-packet-route','gd-manual-arrow')}
    ${arrow('M678 387 H750','gd-packet-route','gd-manual-arrow')}
    ${label(300,376,'PCIe','gd-small')}
    ${label(714,376,'port','gd-small')}
    <g class="gd-manual-lock">${label(186,305,'Host RShim blocked','gd-small')}<path d="M128 281 L152 305 M152 281 L128 305" stroke="#ef7a6c" stroke-width="4"/></g>
    <circle r="7" class="gd-token"><animateMotion dur="12s" repeatCount="indefinite" path="M140 349 V190 H338" keyPoints="0;0;1;1" keyTimes="0;.25;.49;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.25;.5;.75" dur="12s" calcMode="discrete" repeatCount="indefinite"/></circle>
    <circle r="7" class="gd-packet"><animateMotion dur="12s" repeatCount="indefinite" path="M264 387 H750" keyPoints="0;0;1;1" keyTimes="0;.5;.74;1" calcMode="linear"/><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;.25;.5;.75" dur="12s" calcMode="discrete" repeatCount="indefinite"/></circle>
    <circle r="7" class="gd-token"><animateMotion dur="12s" repeatCount="indefinite" path="M264 93 H338" keyPoints="0;0;1" keyTimes="0;.75;1" calcMode="linear"/><animate attributeName="opacity" values="0;0;0;1" keyTimes="0;.25;.5;.75" dur="12s" calcMode="discrete" repeatCount="indefinite"/></circle>
  </svg>`;
}

// Reuse the shared paused/step/replay controller for presentation diagrams.
function phaseToken(path, phase, total, cls='gd-token') {
  const start=phase/total, end=(phase+1)/total;
  const times=[0,...(start ? [start] : []),end,...(end<1 ? [1] : [])];
  const points=[0,...(start ? [0] : []),1,...(end<1 ? [1] : [])];
  const opacity=Array.from({length:total},(_,i)=>i===phase?1:0);
  return `<circle r="7" class="${cls}"><animateMotion dur="${total*3}s" repeatCount="indefinite" path="${path}" keyTimes="${times.join(';')}" keyPoints="${points.join(';')}" calcMode="linear"/><animate attributeName="opacity" values="${opacity.join(';')}" keyTimes="${opacity.map((_,i)=>i/total).join(';')}" dur="${total*3}s" repeatCount="indefinite" calcMode="discrete"/></circle>`;
}
function rolloutDrawing() {
  return `<svg viewBox="0 0 960 430" role="img" aria-label="DPF service rollout: desired configuration, controllers and Argo CD, DPU cluster and service pods, then outcome checks.">
    ${defs('gd-rollout-arrow')}
    <rect x="12" y="12" width="936" height="172" rx="12" class="gd-lane gd-management"/>
    ${label(30,40,'MANAGEMENT · DECLARE AND COORDINATE','gd-lane-title','start')}
    ${box(30,62,234,80,'Desired configuration','Targets + services + settings','gd-host')}
    ${box(346,62,240,80,'DPF controllers','DPUService → Argo CD','gd-host')}
    ${box(690,62,232,80,'Chart / image registries','Versioned service artifacts','gd-services')}
    ${arrow('M264 103 H344','gd-control','gd-rollout-arrow')}
    ${arrow('M690 103 H588','gd-control','gd-rollout-arrow')}
    ${label(302,87,'API','gd-small')}${label(636,87,'resolve','gd-small')}
    <rect x="12" y="226" width="936" height="192" rx="12" class="gd-lane gd-dpu"/>
    ${label(32,255,'DPU CLUSTER · PROVISIONED WORKERS','gd-lane-title','start')}
    ${box(34,286,266,92,'DPU A · selected','Arm OS + service pods','gd-os')}
    ${box(347,286,266,92,'DPU B · selected','Arm OS + service pods','gd-os')}
    ${box(660,286,266,92,'DPU C · outside selection','No change in this example','gd-inactive')}
    ${arrow('M466 142 V209 H166 V284','gd-control','gd-rollout-arrow')}
    ${arrow('M480 142 V284','gd-control','gd-rollout-arrow')}
    ${arrow('M613 334 H640 V162 H540 V144','gd-control','gd-rollout-arrow')}
    ${label(657,179,'status','gd-small')}
    ${label(770,207,'Pods pull their container images','gd-small')}
    ${label(479,401,'Then verify service health and its actual function','gd-small')}
    ${phaseToken('M264 103 H344',0,4)}${phaseToken('M690 103 H588',1,4)}
    ${phaseToken('M466 142 V209 H166 V284',2,4)}${phaseToken('M480 142 V284',2,4)}
    ${phaseToken('M613 334 H640 V162 H540 V144',3,4)}
  </svg>`;
}
function servicePathsDrawing() {
  return `<svg viewBox="0 0 960 450" role="img" aria-label="Top: HBN programs the network engine and host packets forward to the fabric. Bottom: Argus inspects host memory and sends security events to a collector. Argus is not inline in the packet path.">
    ${defs('gd-service-path-arrow')}
    <rect x="12" y="12" width="936" height="224" rx="12" class="gd-lane gd-management"/>
    ${label(32,40,'NETWORKING · CONFIGURED HBN EXAMPLE','gd-lane-title','start')}
    ${box(32,136,210,74,'Host workloads','Applications send traffic','gd-host')}
    ${box(356,57,240,64,'HBN container','Programs network rules','gd-services')}
    ${box(356,150,240,64,'DPU network engine','Hardware forwarding','gd-hardware')}
    ${box(732,136,194,74,'Network fabric','Configured peer','gd-tenant')}
    ${arrow('M476 121 V148','gd-control','gd-service-path-arrow')}
    ${arrow('M242 182 H354','gd-packet-route','gd-service-path-arrow')}${arrow('M596 182 H730','gd-packet-route','gd-service-path-arrow')}
    <rect x="12" y="258" width="936" height="178" rx="12" class="gd-lane gd-dpu"/>
    ${label(32,287,'SECURITY · ARGUS MEMORY INSPECTION','gd-lane-title','start')}
    ${box(32,325,210,74,'Host memory','Workload state','gd-host')}
    ${box(356,325,240,74,'Argus on the DPU','Inspect and analyze','gd-services')}
    ${box(732,325,194,74,'Security collector','Configured event export','gd-tenant')}
    ${arrow('M242 361 H354','gd-control','gd-service-path-arrow')}${arrow('M596 361 H730','gd-control','gd-service-path-arrow')}
    ${label(295,342,'memory','gd-small')}${label(661,342,'events','gd-small')}
    ${phaseToken('M242 182 H730',0,3,'gd-packet')}${phaseToken('M242 361 H354',1,3)}${phaseToken('M596 361 H730',2,3)}
  </svg>`;
}

function fleetDrawing() {
 const rack=(x,n,selected)=>`<g data-rack-selected="${selected}" class="${selected?'':'gd-inactive'}">
  <rect x="${x}" y="196" width="268" height="210" rx="12" class="gd-lane ${selected?'gd-dpu':'gd-management'}"/>
  ${label(x+134,225,`Rack 0${n}`,'gd-lane-title')}${label(x+134,250,`fleet: ${selected?'east':'west'}`,'gd-small')}
  ${[0,1,2].map(i=>`<rect x="${x+20}" y="${266+i*19}" width="228" height="12" rx="2" fill="#40505b"/>`).join('')}
  ${label(x+134,345,'18 trays · 36 BlueField-3 DPUs','gd-small')}
  <text x="${x+134}" y="380" class="gd-text" text-anchor="middle" ${selected?'data-fleet-desired':''}>${selected?'Desired: baseline':'Outside selection'}</text>
 </g>`;
 return `<svg viewBox="0 0 960 452" role="img" aria-label="A YAML change goes to DPF and targets 72 BlueField DPUs in two east racks; the west rack is not selected. Management flow only.">
 ${defs('gd-fleet-arrow')}
 ${box(22,20,220,80,'One YAML change','Telemetry profile reference','gd-host')}
 ${box(339,20,274,80,'DPF management domain','Select · reconcile · observe','gd-services')}
 ${box(703,20,235,80,'Review the outcome','Conditions + actual metrics','gd-host')}
 ${arrow('M242 60 H337','gd-control','gd-fleet-arrow')}${arrow('M613 60 H701','gd-control','gd-fleet-arrow')}
 ${arrow('M440 100 V151 H164 V194','gd-control','gd-fleet-arrow')}
 ${arrow('M480 100 V194','gd-control','gd-fleet-arrow')}
 ${label(650,150,'Same management domain','gd-small')}
 ${rack(30,1,true)}${rack(346,2,true)}${rack(662,3,false)}
 ${phaseToken('M242 60 H337',0,4)}
 ${phaseToken('M440 100 V151 H164 V194',1,4)}${phaseToken('M480 100 V194',1,4)}
 ${phaseToken('M164 266 V312',2,4)}${phaseToken('M480 266 V312',2,4)}
 ${phaseToken('M613 60 H701',3,4)}
 ${label(480,435,'Illustrative rollout · rack icons are aggregated · no measured health','gd-small')}
 </svg>`;
}

function tenantsDrawing() {
 const routeA='M236 187 H724', routeB='M236 330 H724';
 return `<svg viewBox="0 0 960 440" role="img" aria-label="Europe connects racks 01 and 02 through its own VRF and VNI. Asia connects racks 03 and 04 separately. A cross-tenant attempt is blocked. DPF supplies configuration, not workload forwarding.">
 ${defs('gd-tenant-arrow')}
 ${box(322,12,316,64,'DPF · operator management','Deploy HBN + configuration','gd-host')}
 ${arrow('M480 76 V125','gd-control','gd-tenant-arrow')}
 ${label(655,103,'Configuration path','gd-small')}
 <rect x="20" y="134" width="920" height="104" rx="12" fill="#172d25" stroke="#56c587"/>
 <rect x="20" y="277" width="920" height="104" rx="12" fill="#18273b" stroke="#78aae6"/>
 ${arrow(routeA,'sa-europe-route','gd-tenant-arrow')}${arrow(routeB,'sa-asia-route','gd-tenant-arrow')}
 ${box(36,151,200,72,'Europe · Rack 01','Reserved compute','gd-tenant')}
 ${box(330,151,300,72,'HBN · VRF europe','VXLAN VNI 10100','gd-tenant')}
 ${box(724,151,200,72,'Europe · Rack 02','Same tenant network','gd-tenant')}
 ${box(36,294,200,72,'Asia · Rack 03','Reserved compute','gd-host')}
 ${box(330,294,300,72,'HBN · VRF asia','VXLAN VNI 10200','gd-host')}
 ${box(724,294,200,72,'Asia · Rack 04','Same tenant network','gd-host')}
 ${arrow('M480 223 V250','gd-packet-route','gd-tenant-arrow')}
 <path d="M468 249 L492 271 M492 249 L468 271" stroke="#ef7a6c" stroke-width="4"/>
 ${label(667,263,'No cross-tenant route / policy permission','gd-small')}
 ${phaseToken('M480 76 V125',0,4)}${phaseToken(routeA,1,4,'sa-europe-token')}${phaseToken(routeB,2,4,'sa-asia-token')}${phaseToken('M480 223 V250',3,4,'gd-packet')}
 ${label(480,413,'Logical HBN paths across a prepared fabric · illustrative isolation test','gd-small')}
 </svg>`;
}

export function guideDiagram(kind) {
  return `<figure class="guide-diagram" data-guide-diagram="${kind}" data-step="0">
    <div class="gd-toolbar"><span class="gd-heading">${headings[kind]}</span><div class="gd-controls" role="group" aria-label="Diagram animation">
      <button type="button" data-guide-play aria-label="Play animation">▶ Play</button>
      <button type="button" data-guide-next aria-label="Next step">Step →</button>
      <button type="button" data-guide-replay aria-label="Replay animation">↺</button>
    </div></div>
    <div class="gd-legend"><span class="gd-legend-host">Host / management</span><span class="gd-legend-dpu">DPU infrastructure</span><span class="gd-legend-flow">${['fleet','rollout'].includes(kind) ? 'Management step' : kind === 'tenants' ? 'Tenant paths / blocked attempt' : kind === 'servicePaths' ? 'Packet (coral) / inspection (purple)' : kind === 'modes' || kind === 'manual' ? 'Data packet' : 'Provisioning step'}</span></div>
    ${kind === 'manual' ? '<p class="gd-path-key">Dashed arrows: management / configuration. Solid arrows: data forwarding. Playback explains the lifecycle; CLI progress is tracked below.</p>' : ''}
    <div class="gd-scroll" role="region" tabindex="0" aria-label="${headings[kind]} diagram; scroll horizontally on small screens">${kind === 'fleet' ? fleetDrawing() : kind === 'tenants' ? tenantsDrawing() : kind === 'rollout' ? rolloutDrawing() : kind === 'servicePaths' ? servicePathsDrawing() : kind === 'modes' ? modeDrawing() : kind === 'manual' ? manualDrawing() : softwareDrawing()}</div>
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
