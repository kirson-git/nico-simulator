import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState, execute, grade, steps, modeCommand, modeQuery} from '../web/manual-dpu-model.mjs';
const finish = s => {
  for (const step of steps.slice(s.stage)) s = execute(s, step.target, step.command);
  return s;
};
test('clean DPU has an OS, no HBN, and no completion evidence', () => {
  const s = initialState();
  assert.equal(s.mode, 'dpu'); assert.equal(s.os, 'existing');
  assert.equal(s.hbn, false); assert.equal(grade(s).passed, false);
});
test('happy path proves OS, service, network and restrictions separately', () => {
  let s = initialState();
  for (const step of steps) {
    const before = JSON.stringify(s);
    const next = execute(s, step.target, step.command);
    assert.equal(JSON.stringify(s), before, 'model preserves prior state');
    assert.equal(next.stage, s.stage + 1, step.id);
    if (step.id === 'start') assert.equal(next.traffic, false);
    if (step.id !== steps.at(-1).id) assert.equal(grade(next).passed, false);
    s = next;
  }
  assert.equal(grade(s).passed, true);
  for (const key of ['osVerified','services','traffic','restricted','hostBlocked','managementAfter']) assert.equal(s[key],true,key);
  assert.equal(s.dpf, false);
});
test('wrong machine and out-of-order commands cannot complete a step', () => {
  const s = initialState();
  assert.equal(execute(s, 'arm', steps[0].command).stage, 0);
  for (const step of steps.slice(1)) {
    assert.equal(execute(s, step.target, step.command).stage, 0, step.id);
  }
});
test('NIC mode requires staged change and simulated power cycle before Arm access', () => {
  let s = initialState('nic');
  assert.equal(execute(s,'arm','cat /etc/os-release').stage,0);
  assert.equal(execute(s,'host',modeQuery).stage,0);
  s = execute(s,'host',modeCommand);
  assert.equal(s.mode,'nic'); assert.equal(s.pendingMode,'dpu');
  s = execute(s,'host','lab power-cycle');
  assert.equal(s.mode,'dpu'); assert.equal(s.pendingMode,null);
  assert.equal(grade(finish(s)).passed,true);
});
test('restriction command cannot bypass out-of-band access verification', () => {
  const step = steps.find(x=>x.id==='restrict');
  const s = execute(initialState(),step.target,step.command);
  assert.equal(s.restricted,false);
});
test('restricted host cannot reprovision or change mode, Arm still available', () => {
  const s = finish(initialState());
  const bfb = steps.find(x=>x.id==='flash');
  for (const c of [bfb.command,modeCommand]) {
    const next = execute(s,'host',c);
    assert.equal(next.stage,s.stage); assert.equal(next.os,s.os);
    assert.match(next.log.at(-1),/restricted|blocked/i);
  }
  const next = execute(s,'arm','cat /etc/os-release');
  assert.match(next.log.at(-1),/Ubuntu/);
});
test('unknown shell text is inert, cannot inject HTML or chain commands', () => {
  for(const command of ['curl https://evil.example','rm -rf /','<img src=x onerror=alert(1)>',modeQuery+'; reboot',modeQuery+'\nreboot','$(id)']) {
    const s = execute(initialState(),'host',command);
    assert.equal(s.stage,0); assert.equal(s.hbn,false);
    assert.match(s.log.at(-1),/not simulated|single command/i);
  }
});
test('reset discards completion and replayed install cannot retain stale evidence', () => {
  const done=finish(initialState());
  const flash=steps.find(x=>x.id==='flash');
  assert.equal(execute(done,'host',flash.command).stage,done.stage);
  const reset=initialState(); assert.equal(reset.stage,0);assert.equal(grade(reset).passed,false);
});
