// Browser-local rehearsal only. No shell, network, disk or Redfish operations.
export function initialState() {
  return {stage:0, installed:false, mediaMounted:false, diskBootVerified:false,
    hbnDeployed:false, dataTrafficVerified:false, fault:null,
    log:['SIMULATION — prepared Europe scenario. No hardware operations run.']};
}
const sequence=['verify-iso','review-yaml','mount','boot-once','restart','install','verify','eject'];
const output=[
  'ISO signature and checksum valid. Ubuntu Server amd64 selected for the host.',
  'YAML reviewed: host identity, SSH, static management, guard, GPT/EFI/ext4, packages. DPU Arm OS is separate.',
  'HTTP range request: 206. iDRAC VirtualMedia: Inserted=true, WriteProtected=true.',
  'BootSourceOverrideEnabled=Once; BootSourceOverrideTarget=Cd. Disk erase requires the target guard.',
  'GracefulRestart accepted. Firmware -> virtual DVD -> Subiquity. Installer uses the prepared YAML.',
  'Server identity + unique PERC volume + exact capacity: hardware checks passed. Partitioning -> OS copy -> SSH/packages -> bootloader -> reboot.',
  'Ubuntu 24.04.5 LTS; root on /dev/sda2; EFI on /dev/sda1; BootCurrent=Ubuntu. SSH, gateway, DNS and repository checks passed. DPF/DPU Ready.',
  'VirtualMedia: Inserted=false. Temporary media service stopped. Installed host boots independently.'
];
export function act(previous, action) {
  const s={...previous,log:[...previous.log]};
  const stop=message=>{s.log.push('STOP: '+message);return s;};
  if(s.fault && ['wrong-server','serial-mismatch'].includes(action))
    return stop('Resolve the existing guard failure or reset before trying another scenario.');
  if(s.stage===5 && action==='wrong-server') {
    s.fault='identity';return stop('server identity mismatch. No disk writes. Select the correct prepared target.');
  }
  if(s.stage===5 && action==='serial-mismatch') {
    s.fault='serial';return stop('PERC selection matched no disk: lsblk SERIAL differs from udev ID_SERIAL. No disk writes.');
  }
  if(action==='correct-target' && s.stage===5 && s.fault==='identity') {
    s.fault=null;s.log.push('Correct prepared server selected. Hardware checks still required.');return s;
  }
  if(action==='recover') {
    if(s.stage!==5 || s.fault!=='serial')return stop('serial recovery requires the matching failure; it cannot override an identity check.');
    s.fault=null;s.log.push('Recovery: keep the hardware-verified path, omit the incompatible serial; recheck hardware and restart installer.');
    action='install';
  }
  if(sequence[s.stage]!==action)return stop('Complete the current step first.');
  if(s.fault)return stop('Resolve the disk guard failure before continuing.');
  s.log.push(output[s.stage]);
  if(action==='mount')s.mediaMounted=true;
  if(action==='install')s.installed=true;
  if(action==='verify')s.diskBootVerified=true;
  if(action==='eject')s.mediaMounted=false;
  s.stage++;
  return s;
}
export function grade(s) {
  const checks=[['Host installed',s.installed],['Local disk boot and management verified',s.diskBootVerified],['DVD ejected',s.stage===8&&!s.mediaMounted]];
  return {passed:checks.every(([,ok])=>ok),checks};
}
