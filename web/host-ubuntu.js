import {initialState,act,grade} from './host-ubuntu-model.mjs';
const steps=[
 ['Verify the ISO','Use the host architecture: amd64 for this x86 server. Verify Ubuntu’s signed checksum list and the ISO checksum before adding the configuration.','gpgv --keyring ubuntu-archive-keyring.gpg SHA256SUMS.gpg SHA256SUMS\nsha256sum -c selected-iso.sha256','verify-iso','Verify ISO'],
 ['Review the prepared YAML','The ISO contains software; the YAML supplies identity, storage, networking and SSH answers. The hardware guard selects the disk before any formatting.','cat autoinstall.yaml\n# Boot arguments:\n# autoinstall subiquity.autoinstallpath=/cdrom/autoinstall.yaml','review-yaml','Review YAML'],
 ['Mount the virtual DVD','Serve the customized ISO from the administration machine. iDRAC reads it over HTTP with byte-range support; the laptop can disconnect.','POST /redfish/v1/Managers/iDRAC.Embedded.1/VirtualMedia/CD/Actions/VirtualMedia.InsertMedia\n{"Image":"http://192.0.2.10:18080/host.iso","Inserted":true,"WriteProtected":true}','mount','Mount ISO'],
 ['Choose one-time DVD boot','Select CD for the next boot only. Mounting an ISO alone does not start installation.','PATCH /redfish/v1/Systems/System.Embedded.1\n{"Boot":{"BootSourceOverrideEnabled":"Once","BootSourceOverrideTarget":"Cd"}}','boot-once','Set one-time boot'],
 ['Restart into the installer','The physical server restarts through firmware, boots the DVD and reads the prepared YAML. This action is simulated here.','POST /redfish/v1/Systems/System.Embedded.1/Actions/ComputerSystem.Reset\n{"ResetType":"GracefulRestart"}','restart','Restart simulated server'],
 ['Guard the target, then install','The real run checked the server identity, PERC model, exact capacity and a unique non-removable disk. Installation replaces that volume’s contents while retaining RAID membership. Try a failure before continuing.','python3 /cdrom/europe/guard.py\n# Guard succeeds -> Subiquity/curtin partitions and installs\n# Failure stops before disk writes','install','Run guarded installation'],
 ['Verify the installed host','A reported OSRunning state is not enough. Check SSH, OS identity, root disk, UEFI boot, management connectivity and the installation marker. Recheck DPF and the DPU separately.','cat /etc/os-release\nlsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS\nip route\nsystemctl is-active ssh\nsudo efibootmgr -v','verify','Verify installed Ubuntu'],
 ['Eject installation media','The installed host boots from its local disk. Eject the DVD and stop the temporary ISO service after verification.','POST /redfish/v1/Managers/iDRAC.Embedded.1/VirtualMedia/CD/Actions/VirtualMedia.EjectMedia\n{}','eject','Eject DVD'],
 ['Host ready; HBN comes next','Ubuntu installation is complete in this rehearsal. The DPU OS and HBN service lifecycle are separate. Check your work to see the handoff.','# Next lesson: configure and verify the HBN data path\n# HBN is not installed by this exercise.',null,null]
];
let state=initialState();const $=id=>document.getElementById(id);
$('yaml').textContent=`# SIMULATION ONLY: shortened preview, not an installation payload
autoinstall:
  version: 1
  identity:
    hostname: sim-europe-host
    username: ubuntu
    password: "!" # locked teaching account, no secret
  ssh:
    install-server: true
  network:
    version: 2
    ethernets:
      mgmt0:
        addresses: [192.0.2.31/24] # fictitious training address
  storage:
    config:
      - id: system-disk
        type: disk
        path: /dev/SIMULATION_ONLY_NO_DISK
  early-commands: ["python3 /cdrom/europe/guard.py"]
  shutdown: reboot`;
function render(){
 const [title,text,command,action,label]=steps[state.stage];
 $('progress').textContent=`${Math.min(state.stage,8)} / 8 STEPS COMPLETE`;
 $('steps').replaceChildren(...steps.slice(0,8).map(([name],i)=>{const p=document.createElement('div');p.textContent=`${i<state.stage?'✓':'○'} ${i+1}. ${name}`;return p;}));
 $('title').textContent=title;$('explanation').textContent=text;$('command').textContent=command;
 $('actions').replaceChildren();if(action){const b=document.createElement('button');b.className='primary';b.textContent=label;b.onclick=()=>run(action);$('actions').append(b);}
 $('faults').hidden=state.stage!==5;$('faults').style.display=state.stage===5?'flex':'none';
 $('recover').disabled=state.fault!=='serial';$('correct-target').disabled=state.fault!=='identity';
 $('console').textContent=state.log.join('\n\n');$('console').scrollTop=$('console').scrollHeight;
 $('handoff').hidden=!grade(state).passed;
}
function run(action){state=act(state,action);$('result').textContent='Progress updated. Check your work when ready.';render();}
for(const a of ['wrong-server','serial-mismatch','recover','correct-target'])$(a).onclick=()=>run(a);
$('check').onclick=()=>{const g=grade(state);$('result').textContent=(g.passed?'Lesson complete. ':'Keep going. ')+g.checks.map(([name,ok])=>`${ok?'✓':'○'} ${name}`).join(' · ');};
$('reset').onclick=()=>{state=initialState();$('result').textContent='Scenario reset. Prepared assets restored; start again.';render();};render();
