import './course-nav.js';
import {initialState,execute,grade,steps,prepared,modeCommand} from './manual-dpu-model.mjs';
import {guideDiagram,mountGuideDiagrams} from './guide-diagrams.js';
const $ = id => document.getElementById(id);
let state=initialState();
$('manual-diagram').innerHTML=guideDiagram('manual');
const diagram=mountGuideDiagrams($('manual-diagram'));
window.addEventListener('pagehide',()=>diagram.pause());
$('manual-bfcfg').textContent=prepared['bf.cfg'];
$('manual-interfaces').textContent=prepared.interfaces;
$('manual-recovery-command').textContent=modeCommand+'\nlab power-cycle';
const targets={host:'Host · x86 Linux',arm:'DPU · Arm Linux',hbn:'HBN · container shell',management:'Management · BMC access'};
function render(follow=false) {
  const step=steps[state.stage];
  $('manual-progress').textContent=`${state.stage} / ${steps.length} checks complete`;
  $('manual-phase').textContent=step?.phase ?? 'COMPLETE';
  $('manual-title').textContent=step?.title ?? 'Manual rehearsal complete';
  $('manual-purpose').textContent=step?.purpose ?? 'Review the evidence and compare the manual responsibilities with DPF below. No physical DPU was changed.';
  $('manual-command').textContent=step?.command ?? 'help';
  $('manual-where').textContent=step ? `Run on: ${targets[step.target]}` : 'Outcome: simulated HBN and host restrictions verified.';
  $('manual-load').disabled=!step;
  if(follow&&step) $('manual-target').value=step.target;
  $('manual-prompt').textContent=$('manual-target').value+' $';
  $('manual-console').textContent=state.log.join('\n\n');
  $('manual-console').scrollTop=$('manual-console').scrollHeight;
  const statuses=[['Mode',state.mode==='dpu'?'DPU':'NIC',state.modeVerified],['Arm OS',state.os==='bfb'?'BFB installed':'existing',state.osVerified],['HBN',state.hbn?'started':'absent',state.services],['Host access',state.restricted?'restricted':'trusted',state.hostBlocked]];
  $('manual-status').replaceChildren(...statuses.map(([key,value,ok])=>{const el=document.createElement('span');el.textContent=`${key}: ${value}`;el.dataset.ready=String(ok);return el;}));
  $('manual-steps').replaceChildren(...steps.map((s,i)=>{const el=document.createElement('li');el.textContent=`${i<state.stage?'✓ ':''}${s.title} — ${targets[s.target]}`;if(i===state.stage)el.setAttribute('aria-current','step');return el;}));
  $('manual-handoff').hidden=!grade(state).passed;
}
$('manual-target').onchange=()=>{$('manual-prompt').textContent=$('manual-target').value+' $';};
$('manual-load').onclick=()=>{const step=steps[state.stage];if(step){$('manual-input').value=step.command;$('manual-input').focus();}};
$('manual-form').onsubmit=event=>{
  event.preventDefault();
  const input=$('manual-input').value;
  if(!input.trim())return;
  const previous=state.stage;
  state=execute(state,$('manual-target').value,input);
  $('manual-input').value='';
  render(state.stage!==previous);
  $('manual-result').textContent=state.stage===previous ? state.log.at(-1) : grade(state).passed ? 'Lesson complete. All simulated evidence checks passed. DPF is the next learning path.' : `Step ${state.stage} complete. Next: ${steps[state.stage].title}.`;
  $('manual-input').focus();
};
$('manual-check').onclick=()=>{const g=grade(state);$('manual-result').textContent=(g.passed?'Lesson complete. ':'Keep going. ')+g.checks.map(([name,ok])=>`${ok?'✓':'○'} ${name}`).join(' · ');};
function reset(mode) {diagram.pause();state=initialState(mode);$('manual-input').value='';$('manual-result').textContent=mode==='nic'?'NIC-mode scenario: query mode, stage the change and simulate a power cycle.':'Clean scenario restored. Existing Arm OS; no HBN.';render(true);}
$('manual-reset').onclick=()=>reset('dpu');
$('manual-nic').onclick=()=>reset('nic');
$('manual-export').onclick=()=>{
  const text='NICo Simulator — manual DPU lesson\nAUTHORED SIMULATED OUTPUT; NOT A HARDWARE RECORD\n\n'+state.log.join('\n\n')+'\n';
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));
  const a=document.createElement('a');a.href=url;a.download='manual-dpu-simulated-transcript.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
render(true);
