// Run only inside the workshop container, against the dedicated training cluster.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile, writeFile} from 'node:fs/promises';
import {WebSocket} from 'ws';
const exec = promisify(execFile);
const base = 'http://localhost:3000';
async function post(path) {
  const response = await fetch(`${base}/api/${path}`, {method: 'POST', headers: {Origin: base}});
  assert.equal(response.status, 200);
  return response.json();
}
async function k(...args) {
  console.log('LIVE TEST COMMAND:', ['kubectl', ...args].join(' '));
  return exec('kubectl', ['--kubeconfig', '/run/workshop/kubeconfig.json', '--request-timeout=15s', ...args], {timeout: 40000});
}
test('browser access rejects another origin and hides credential files', async () => {
  assert.equal((await fetch(`${base}/api/reset`, {method: 'POST', headers: {Origin: 'https://evil.example'}})).status, 403);
  assert.equal((await fetch(`${base}/api/check`, {method: 'POST'})).status, 403);
  assert.equal((await fetch(`${base}/run/workshop/kubeconfig.json`)).status, 404);
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  await new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws/term', {origin: 'https://evil.example'});
    ws.on('open', () => {ws.close(); reject(new Error('Cross-origin shell was allowed'));});
    ws.on('unexpected-response', (_request, response) => { assert.equal(response.statusCode, 403); response.resume(); ws.terminate(); resolve(); });
    ws.on('error', () => {});
  });
});
test('live grading fails before and after wrong YAML, passes correct YAML; reset preserves other namespaces', async () => {
  await post('reset');
  assert.equal((await post('check')).passed, false);
  const starter = await readFile('/workspace/europe.yaml', 'utf8');
  await writeFile('/workspace/europe.yaml', starter.replace('region: europe', 'region: wrong'));
  await k('apply', '-f', '/workspace/europe.yaml');
  assert.equal((await post('check')).passed, false);
  await k('apply', '-f', '/app/lessons/europe.yaml');
  assert.equal((await post('check')).passed, true);
  await k('create', 'namespace', 'workshop-test-keep');
  try {
    await post('reset');
    assert.equal((await post('check')).passed, false);
    assert.equal(await readFile('/workspace/europe.yaml', 'utf8'), starter);
    assert.match((await k('get', 'namespace', 'workshop-test-keep', '-o', 'name')).stdout, /workshop-test-keep/);
  } finally { await k('delete', 'namespace', 'workshop-test-keep', '--wait=true', '--timeout=30s'); }
});
test('WebSocket terminal executes a real Bash process and queries real nodes', async () => {
  await new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws/term', {origin: base});
    let output = '';
    const timer = setTimeout(() => { ws.close(); reject(new Error(`Shell timeout: ${output}`)); }, 20000);
    ws.on('open', () => ws.send("kubectl get nodes -o name; printf '\\nSHELL_%s\\n' VERIFIED\r"));
    ws.on('message', chunk => {
      output += chunk;
      if (output.includes('SHELL_VERIFIED')) {
        clearTimeout(timer); ws.close();
        try { assert.match(output, /node\/dpf-training-control-plane/); assert.match(output, /node\/dpf-training-worker/); resolve(); }
        catch (error) { reject(error); }
      }
    });
    ws.on('error', error => { clearTimeout(timer); reject(error); });
  });
});
