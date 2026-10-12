import {guideDiagram} from './guide-diagrams.js';
const base='https://networking-docs.nvidia.com/dpf/26.4.0/';
const hardware='https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html';
const networking='https://docs.nvidia.com/dgx/dgxgb200-user-guide/networking.html';

// An illustrative complete DPUDeployment object, not a standalone installation.
// Referenced objects and labels are fictional, prepared dependencies in this story.
export const fleetYaml=profile=>`# Presentation example · DPF 26.4.0 API
# Dependencies and inventory must already be prepared.
apiVersion: svc.dpu.nvidia.com/v1alpha1
kind: DPUDeployment
metadata:
  name: east-telemetry
  namespace: dpf-operator-system
spec:
  dpus:
    bfb: qualified-bfb
    flavor: qualified-flavor
    nodeEffect:
      hold: true
    dpuSetStrategy:
      type: RollingUpdate
    dpuSets:
      - nameSuffix: east
        dpuNodeSelector:
          matchLabels:
            demo.example.com/fleet: east
        dpuDeviceSelector:
          matchLabels:
            demo.example.com/managed: "true"
        dpuClusterSelector:
          demo.example.com/cluster: infra-east
  services:
    dts:
      serviceTemplate: qualified-dts
      serviceConfiguration: telemetry-${profile}
`;

const rackPicture=()=>`<figure class="sa-nvl-picture" aria-label="Simplified DGX GB200 NVL72 rack, 18 compute trays and nine NVLink switch trays">
 <div class="sa-nvl-frame"><div class="sa-nvl-label">DGX GB200 · NVL72</div>
 ${Array.from({length:9},(_,i)=>`<div class="sa-tray"><b>${String(i+1).padStart(2,'0')}</b><span>Compute tray</span><i>4 GPUs</i><em>2 DPUs</em></div>`).join('')}
 <div class="sa-nvl-switch">9 × NVLink switch trays<br><small>GPU scale-up fabric</small></div>
 ${Array.from({length:9},(_,i)=>`<div class="sa-tray"><b>${i+10}</b><span>Compute tray</span><i>4 GPUs</i><em>2 DPUs</em></div>`).join('')}
 <div class="sa-nvl-base">Power · cooling · management</div></div>
 <figcaption>Schematic grouping, not a physical rack elevation.</figcaption></figure>`;

export const fleetSlides=[
 {id:'rack',label:'Inside an NVL72 rack',title:'One rack. Several different fabrics.',lead:'Use a DGX GB200 NVL72 rack to locate the BlueField infrastructure.',body:()=>`<div class="sa-rack-layout">${rackPicture()}<div class="sa-rack-explain"><div class="sa-rack-numbers"><span><b>72</b>Blackwell GPUs</span><span><b>36</b>Grace CPUs</span><span><b>36</b>BlueField-3 DPUs*</span></div><article class="sa-fabric-card"><b>NVLink · inside the rack</b><p>Connects the GPUs through nine switch trays. NVLink fabric management has its own control plane.</p></article><article class="sa-fabric-card"><b>ConnectX · between racks</b><p>The compute fabric carries distributed GPU workload traffic.</p></article><article class="sa-fabric-card sa-dpf-scope"><b>BlueField · DPF’s focus here</b><p>Provision the DPU baseline and operate compatible networking, storage, security and telemetry services.</p></article></div></div><p class="sa-footnote">*DGX GB200 example: 18 trays × 2 BlueField-3 DPUs. Other NVL72 designs differ. Rack hardware is documented; this DPF overlay is conceptual and does not assert a validated DGX deployment or BF4 support.</p>`,notes:'Point to the DPUs in every compute tray. One selected rack has 36 possible DPU endpoints in this hardware example. DPF does not replace the GPU scheduler, NVLink fabric manager, power or cooling controls. Separate DPF qualification is required for the actual rack, DPU modes and installed software.',refs:[['DGX rack hardware',hardware],['Separate network fabrics',networking],['DPF architecture',base+'overview']]},
 {id:'fleet',label:'One YAML → many racks',title:'Change the intent once. Reconcile the selected fleet.',lead:'Example: switch the prepared telemetry profile for BlueField DPUs in two racks.',body:()=>`<div class="sa-profile-controls" role="group" aria-label="Telemetry desired configuration"><button type="button" data-fleet-profile="baseline" aria-pressed="true">Baseline telemetry</button><button type="button" data-fleet-profile="detailed" aria-pressed="false">Detailed telemetry</button><span>Changes the example YAML only</span></div><p id="sa-fleet-intent" class="sa-takeaway" aria-live="polite"></p>${guideDiagram('fleet')}<div class="sa-yaml-layout"><div><h2>One changed YAML line</h2><pre class="sa-yaml-diff"><code><span>− serviceConfiguration: telemetry-baseline</span>\n<strong>+ serviceConfiguration: telemetry-detailed</strong></code></pre><p>The same selector covers Rack 01 and Rack 02. Rack 03 has a different fleet label and stays outside this deployment.</p><p><b>Target:</b> management Kubernetes API.<br><b>Reconciler:</b> DPUDeployment and service controllers.<br><b>Effect:</b> selected DPU service workloads consume the referenced configuration.</p><p class="sa-footnote">Both profiles, the service template, BFB and flavor are pre-created examples in the same namespace. Labels must exist on DPUNodes, DPUDevices and DPUClusters. This file alone does not install a fleet.</p><p class="sa-footnote">RollingUpdate governs DPUSet updates; service disruption also depends on service upgrade policy. <code>hold: true</code> waits for external maintenance coordination when node effect is needed. Fleet size and availability require a qualified design.</p></div><details class="sa-yaml-full"><summary>Show complete example DPUDeployment</summary><pre tabindex="0" role="region" aria-label="Example DPUDeployment YAML"><code id="sa-fleet-yaml"></code></pre></details></div>`,notes:'Select Detailed telemetry, point at the single changed serviceConfiguration reference, then play the diagram. This is a change to an already prepared environment, not a one-file bootstrap. Two racks × 36 labeled DPUs = 72 targets; this is example arithmetic, not a scale qualification. All racks belong to one DPF management domain. Independent domains need an additional delivery/GitOps workflow. Failures must remain visible; the animation is not live health. The controller resolves dependencies and rolls out according to configured policies, not an atomic all-rack transaction.',refs:[['DPUDeployment and selection',base+'dpudeployment'],['Telemetry service',base+'doca-telemetry-service'],['Versioned API definitions','https://github.com/NVIDIA/doca-platform/blob/v26.4.0/api/dpuservice/v1alpha1/dpudeployment_types.go']]},
 {id:'tenants',label:'Europe + Asia isolation',title:'Shared operations. Separate tenant networks.',lead:'Reserve whole racks per tenant in this example; connect each tenant across its own racks.',body:()=>guideDiagram('tenants')+`<div class="sa-tenant-rules"><article><h2>1 · Assign resources</h2><p>Europe owns Racks 01–02; Asia owns Racks 03–04. The resource scheduler enforces host/GPU ownership. No shared NVLink domain is split in this example.</p></article><article><h2>2 · Enforce the network</h2><p>Attach tenant interfaces to distinct HBN VRFs and VXLAN VNIs. Configure EVPN/fabric policy with no cross-tenant route import. Restrict host control of the DPU.</p></article><article><h2>3 · Prove isolation</h2><p>Same-tenant traffic should work. Cross-tenant traffic and unauthorized management access must fail. Also validate storage permissions and the separate compute fabric.</p></article></div><p class="sa-takeaway">DPF delivers the configuration. DPU services and fabric policy enforce the network boundary.</p><p class="sa-footnote">Europe/Asia, VRF names and VNIs 10100/10200 are teaching values. Kamaji “tenant” clusters host DPU Kubernetes control planes; they are not automatically customer network boundaries. Namespaces alone do not provide isolation. VXLAN segmentation is not encryption.</p>`,notes:'This four-rack scenario is independent of the three-rack telemetry example. HBN is the networking example, not an implication that telemetry enables isolation. Keep operator access separate with authentication and RBAC, plus restricted host-to-DPU control in a qualified zero-trust setup. Configure PF/VF attachment and VRF/VNI/route-target mappings consistently with the fabric. HBN isolation covers paths through HBN; it does not cover a separate ConnectX/InfiniBand network or NVLink. GPU, fabric and storage isolation need their own controls. An alternative is OVN VPC, explicitly tech preview in the linked DPF 26.4.0 guide; do not silently equate it to HBN.',refs:[['HBN isolated VRF example',base+'hbn-in-dpf-zero-trust'],['Zero Trust model',base+'zero-trust-deployment'],['OVN VPC alternative · tech preview',base+'ovn-vpc-service-deployment-guide'],['Other rack fabrics',networking]]},
];

export function showFleetProfile(profile) {
 if(!['baseline','detailed'].includes(profile))return;
 const yaml=document.getElementById('sa-fleet-yaml');
 if(!yaml)return;
 yaml.textContent=fleetYaml(profile);
 document.getElementById('sa-fleet-intent').textContent=`Desired profile: ${profile} telemetry → 72 DPUs across 2 selected racks. Illustrative intent, not live status.`;
 for(const button of document.querySelectorAll('[data-fleet-profile]'))button.setAttribute('aria-pressed',String(button.dataset.fleetProfile===profile));
 for(const text of document.querySelectorAll('[data-fleet-desired]'))text.textContent=`Desired: ${profile}`;
 document.querySelector('[data-guide-replay]')?.click();
}
