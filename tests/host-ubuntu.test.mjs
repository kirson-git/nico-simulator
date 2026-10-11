import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState, act, grade} from '../web/host-ubuntu-model.mjs';
const prepare = () => ['verify-iso','review-yaml','mount','boot-once','restart'].reduce(act, initialState());
test('cannot install before media, one-time boot and correct hardware identity', () => {
  for (const action of ['mount','boot-once','restart','install','verify','eject']) {
    const s=act(initialState(), action);
    assert.equal(s.installed,false); assert.equal(grade(s).passed,false);
  }
  const s=act(prepare(),'wrong-server');
  assert.equal(s.installed,false); assert.match(s.log.at(-1),/identity mismatch/);
});
test('serial mismatch stops before disk writes; path recovery retains hardware guard', () => {
  let s=act(prepare(),'serial-mismatch');
  assert.equal(s.installed,false); assert.equal(s.stage,5);
  s=act(s,'recover');
  assert.equal(s.installed,true); assert.equal(s.stage,6);
  assert.match(s.log.join('\n'),/hardware checks passed/);
});
test('complete installation verifies local boot, cleans media, and leaves HBN pending', () => {
  let s=['verify-iso','review-yaml','mount','boot-once','restart','install'].reduce(act,initialState());
  assert.equal(grade(s).passed,false);
  s=act(s,'verify'); assert.equal(grade(s).passed,false);
  s=act(s,'eject');assert.equal(grade(s).passed,true);
  assert.equal(s.hbnDeployed,false); assert.equal(s.dataTrafficVerified,false);
  assert.equal(s.mediaMounted,false);assert.equal(s.diskBootVerified,true);
  const old=JSON.stringify(s);act(s,'restart');assert.equal(JSON.stringify(s),old,'actions must not mutate old state');
  assert.equal(grade(initialState()).passed,false,'reset requires completing lesson again');
});

test('switching failure examples cannot bypass an unresolved hardware guard', () => {
  let s=act(prepare(),'wrong-server');
  s=act(s,'serial-mismatch');
  s=act(s,'recover');
  assert.equal(s.installed,false);
  assert.equal(s.fault,'identity');
});
