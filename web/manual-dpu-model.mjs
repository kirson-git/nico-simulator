// Teaching fixtures only. No subprocess, eval, network, storage or hardware access.
export const device = '/dev/mst/mt41692_pciconf0';
export const modeQuery = `sudo mlxconfig -d ${device} q INTERNAL_CPU_OFFLOAD_ENGINE`;
export const modeCommand = `sudo mlxconfig -d ${device} s INTERNAL_CPU_OFFLOAD_ENGINE=0`;
const managementQuery = 'curl --fail --cacert lab-ca.pem --user root https://192.0.2.246/redfish/v1/Systems/Bluefield/Oem/Nvidia';
export const prepared = {
  'bf.cfg': `# Prepared simulation: dual-port BlueField-3, HBN-only bridge
# BFB selection and device identity are prechecked in this teaching fixture.
ENABLE_BR_HBN=yes
BR_HBN_UPLINKS="p0,p1"
BR_HBN_REPS="pf0hpf,pf1hpf"
`,
  'interfaces': `# Fictional routed test fixture, consumed by the preparation step.
# This is the complete teaching file, not a universal HBN deployment file.
auto lo
iface lo inet loopback

auto pf0hpf_if
iface pf0hpf_if inet static
    address 192.0.2.1/24

auto p0_if
iface p0_if inet static
    address 198.51.100.1/24

auto p1_if
iface p1_if inet manual
`,
};
const step = (id, phase, title, target, command, purpose, output, effect = {}) =>
  ({id, phase, title, target, command, purpose, output, effect});
export const steps = [
  step('mode','Discover','Confirm the operating mode','host',modeQuery,
    'The host and Arm OS are separate computers. HBN needs active Arm services in DPU mode. A NIC-mode device must change mode and reset first.',
    'INTERNAL_CPU_OFFLOAD_ENGINE: ENABLED(0) — DPU mode', {modeVerified:true}),
  step('inspect','Discover','Inspect the existing DPU OS','arm','cat /etc/os-release',
    'Start with a bootable Arm Ubuntu system, but no HBN. A DPU is a network adapter with its own Arm CPU, memory, OS and network hardware. This is not the host Ubuntu installation.',
    'Ubuntu 22.04 LTS — existing Arm OS. HBN: not installed.'),
  step('management','Discover','Check independent management access','management',managementQuery,
    'This request targets the DPU BMC from the management machine. The simulator supplies a fictional authenticated session; do not enter a real password. Keep this path before restricting the host.',
    'Authenticated training response: {"Mode":"DpuMode"}\nIndependent management path verified.', {management:true}),
  step('config','Provision','Inspect the prepared BFB settings','host','cat bf.cfg',
    'These settings prepare port connections during BFB installation. They do not start an HBN container.',prepared['bf.cfg'], {config:true}),
  step('checksum','Provision','Verify the selected BFB artifact','host','sha256sum -c training.bfb.sha256',
    'A full BFB carries the DPU OS and supporting software/firmware. Our fictional artifact is already matched to the BlueField-3 teaching profile; a real checksum must come from a trusted release.',
    'training.bfb: OK (simulated checksum fixture; no image download)', {checksum:true}),
  step('flash','Provision','Reinstall the Arm OS from the BFB','host','sudo bfb-install --bfb training.bfb --config bf.cfg --rshim rshim0',
    'This standalone example pushes the bundle through host RShim. It replaces the existing Arm OS. BMC/Redfish provisioning used by DPF is a separate transport. Wait for completion before any reset.',
    'Host sends BFB + configuration over RShim.\nDPU installer replaces the Arm OS and prepares the ports.\nInstallation completes; Arm Linux boots. HBN container still absent.', {os:'bfb',hbn:false}),
  step('os','Provision','Verify the new Arm software','arm','cat /etc/mlnx-release',
    'Read the release inside the DPU. Successful transfer alone does not verify the installed OS. The fixture models a DOCA 3.4 / Ubuntu 22.04 bundle, not a BlueField-4 installation recipe.',
    'Teaching profile: bf-bundle / DOCA 3.4 / Ubuntu 22.04 / Arm64\nNew Arm OS verified; this line is simulated, not captured release output.', {osVerified:true}),
  step('routing','Services','Inspect the prepared HBN network file','arm','cat /opt/training/hbn/etc/network/interfaces',
    'Two fictional subnets connect the host-facing interface and uplink. The host and peer return route are preconfigured in this fixture. The next setup step consumes this file; no file editing is required.',
    prepared.interfaces, {routingReviewed:true}),
  step('prepare','Services','Prepare HBN on the Arm OS','arm','sudo ./hbn-dpu-setup.sh',
    'Work from the preloaded, version-matched HBN resource script directory. Preparation creates the service environment and installs the prepared configuration; it does not prove the container is running.',
    'Prepared service directories and mount points.\nInstalled the training network configuration. Container not yet started.', {prepared:true}),
  step('start','Services','Start the HBN container','arm','sudo cp doca_hbn.yaml /etc/kubelet.d/',
    'Use the vendor manifest from the matching resource configs directory. The standalone kubelet watches this directory. This is not a DPF-managed tenant cluster; DPF uses its own service resources.',
    'Manifest copied (simulation). Kubelet pulls the selected HBN image and creates a container.', {hbn:true}),
  step('container','Services','Inspect the container state','arm','sudo crictl ps',
    'The DPU OS hosts the container runtime. Running is a process state; service health and forwarding still need checks.',
    'CONTAINER   STATE     NAME\nsim-hbn     Running   doca-hbn', {containerVerified:true}),
  step('logs','Services','Read HBN startup output','arm','sudo crictl logs sim-hbn',
    'Use the container ID from crictl ps. sim-hbn is a fictional ID. These lines are authored teaching output, not logs fetched from a real DPU.',
    'SIMULATED HBN startup: network configuration loaded; service processes started.\nNext: inspect the processes inside the container.'),
  step('services','Validate','Check inside the HBN container','hbn','supervisorctl status',
    'The HBN terminal represents a shell opened with crictl exec in sim-hbn. It shares DPU resources but is a distinct environment from the Arm OS shell.',
    'frr       RUNNING\nnl2doca   RUNNING\nneighmgr  RUNNING\nService checks passed in the fixture.', {services:true}),
  step('route','Validate','Inspect the configured route','hbn','ip route',
    'Read the two connected routes inside HBN. Configuration is explicit; selecting DPU mode alone does not create routing or VXLAN.',
    '192.0.2.0/24 dev pf0hpf_if src 192.0.2.1\n198.51.100.0/24 dev p0_if src 198.51.100.1', {routeVerified:true}),
  step('traffic','Validate','Test the prepared forwarding path','host','ping -c 3 198.51.100.2',
    'Our host is 192.0.2.10 with gateway 192.0.2.1; the peer has a return route via 198.51.100.1. This fixture checks a configured routed path. It does not prove hardware offload or tenant isolation.',
    'SIMULATED: 3 packets transmitted, 3 received.\nPath: host → DPU forwarding hardware → uplink → test peer.\nNo packets were actually sent.', {traffic:true}),
  step('restrict','Restrict','Apply host restrictions from the Arm OS','arm',`sudo mlxprivhost -d ${device} r --disable_rshim --disable_tracer --disable_counter_rd --disable_port_owner`,
    'Keep DPU mode active and restrict host management privileges. This step belongs on the Arm side after the independent management check. Zero Trust host restrictions are distinct from a network ACL.',
    'SIMULATED: host restrictions applied. Arm services remain active; host RShim access is disabled.', {restricted:true}),
  step('blocked','Restrict','Prove the host lost RShim access','host','sudo cat /dev/rshim0/misc',
    'An unavailable host RShim path is expected in this restricted fixture. A failed management attempt is not evidence that all data traffic is blocked.',
    'SIMULATED: host RShim unavailable under the applied restriction.\nExpected denied-access check passed.', {hostBlocked:true}),
  step('management-after','Restrict','Verify management still works','management',managementQuery,
    'Recheck the independent BMC path. Completion requires both denied host access and preserved management; a Mode field alone cannot prove all restrictions.',
    'Authenticated training response: {"Mode":"DpuMode"}\nManagement still reachable. Combine this with the denied host check.', {managementAfter:true}),
];
const expectedResults = [
  "DPU mode is ENABLED(0). In the optional NIC-mode scenario, stage the change and simulate a power cycle before continuing.",
  "Ubuntu is running on the DPU’s Arm computer. This says nothing about the host OS or whether HBN is installed.",
  "The fictional BMC request succeeds from the management machine. This gives you a separate path before host access is restricted.",
  "Bridge settings list the two uplinks and host representors. Reading this file changes nothing; the installer consumes it later.",
  "The simulated checksum is OK. On hardware, verify against a checksum from a trusted release before installing.",
  "The bundle transfer and Arm OS installation finish. The HBN container is still absent: installing an OS and starting a service are separate steps.",
  "The simulated release identifies the newly installed Arm software. A successful transfer alone would not establish this.",
  "The file defines host-facing and uplink subnets. This prepared example uses routing, with no VXLAN configuration.",
  "Service directories and networking configuration are prepared. The container has not started yet.",
  "The standalone kubelet consumes the manifest and starts the container. The following checks establish whether it is healthy.",
  "The fictional sim-hbn container is Running. This verifies its process state, not packet forwarding.",
  "The authored startup lines report configuration loaded and processes started. Next, check those processes from inside the container.",
  "FRR, nl2doca and neighmgr show RUNNING. These are simulated HBN service checks, separate from the Arm OS check.",
  "Two connected routes match the prepared subnets. DPU mode by itself does not create these routes.",
  "Three fictional replies demonstrate the intended host-to-peer path. No packets were sent and hardware offload is not proven.",
  "Host management privileges are restricted while Arm services remain active. This is a privilege boundary, not a tenant network ACL.",
  "Host RShim access fails. Here that failure is the expected success condition; it does not imply host data traffic is blocked.",
  "The independent BMC request still succeeds. Together with the denied host check, it completes the simulated management boundary test."
];
steps.forEach((step, index) => { step.expected = expectedResults[index]; });

export function initialState(mode = 'dpu') {
  return {stage:0,mode,pendingMode:null,os:'existing',hbn:false,restricted:false,
    modeVerified:false,management:false,osVerified:false,services:false,
    traffic:false,hostBlocked:false,managementAfter:false,dpf:false,
    log:['SIMULATION ONLY — fictional BlueField-3 scenario. No commands run on Linux or hardware.']};
}
export function execute(previous, target, input) {
  const s = {...previous,log:[...previous.log]};
  const command = input.trim().replace(/[\t ]+/g,' ');
  const say = text => {s.log.push(text); return s;};
  s.log.push(`[${target}] $ ${input.slice(0,1000)}`);
  if(/[\n\r;]/.test(command)) return say('Enter a single command; shell chaining is not simulated.');
  if(command === 'help') return say('Use the displayed command and terminal target. Supported utilities: cat, mlxconfig, bfb-install, crictl, supervisorctl, ip route, ping and mlxprivhost. lab power-cycle is a simulation control.');
  if(s.restricted && target === 'host' && (command.includes('bfb-install') || command.includes('mlxconfig') && command.includes(' s '))) return say('Blocked: this host is restricted. Use the independent management path for a real recovery workflow.');
  if(command === modeCommand) {
    if(target !== 'host' || s.stage !== 0) return say('Mode recovery is available only on the host at the first step. Reset the lesson to try it.');
    s.pendingMode = 'dpu'; return say('DPU mode staged. Current mode is unchanged until reset. Run lab power-cycle (simulation only).');
  }
  if(command === 'lab power-cycle') {
    if(target !== 'host' || s.stage !== 0 || s.pendingMode !== 'dpu') return say('Stage the DPU-mode change on the host first.');
    s.mode='dpu';s.pendingMode=null;return say('SIMULATED power cycle complete. Arm OS available. Query the mode again.');
  }
  const current = steps[s.stage];
  const matched = current?.command === command ? current : steps.find(x=>x.command===command);
  if(!matched) return say('Command not simulated. Type help or load the prepared command. Nothing was executed.');
  if(target !== matched.target) return say(`Wrong terminal: this command belongs on ${matched.target}. No state changed.`);
  if((target==='arm'||target==='hbn') && s.mode !== 'dpu') return say('Arm OS is unavailable in this NIC-mode fixture. Change mode from the host and simulate the reset first.');
  if(command===modeQuery && s.mode !== 'dpu') return say('INTERNAL_CPU_OFFLOAD_ENGINE: DISABLED(1) — NIC mode. Stage DPU mode and reset before continuing.');
  if(s.restricted && command==='cat /etc/os-release') return say('Ubuntu 22.04 LTS — provisioned Arm OS remains accessible to the infrastructure administrator.');
  if(matched !== current) return say(`Complete the current step first: ${current?.title ?? 'lesson complete; reset to repeat'}.`);
  Object.assign(s,matched.effect);s.stage++;
  return say(matched.output);
}
export function grade(s) {
  const checks = [
    ['DPU mode confirmed',s.modeVerified],['New Arm OS verified',s.osVerified],
    ['HBN container and services checked',!!s.containerVerified&&s.services],
    ['Configured forwarding tested',s.traffic],['Host restriction demonstrated',s.restricted&&s.hostBlocked],
    ['Independent management preserved',s.management&&s.managementAfter],
  ];
  return {checks,passed:s.stage===steps.length&&checks.every(([,ok])=>ok)};
}
