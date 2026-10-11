// Terminal transport adapted from k8s-101-launchable; see THIRD_PARTY_NOTICES.txt.
import {createServer} from 'node:http';
import {readFile, copyFile, access} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import {WebSocketServer, WebSocket} from 'ws';
import pty from 'node-pty';
import {allowedRequest, gradeLesson, validateCluster} from './lesson.mjs';

const exec = promisify(execFile);
const kubeconfig = '/run/workshop/kubeconfig.json';
validateCluster(JSON.parse(await readFile(kubeconfig, 'utf8')));
const env = {...process.env, KUBECONFIG: kubeconfig};
try { await access('/workspace/europe.yaml'); }
catch { await copyFile('/app/lessons/europe.yaml', '/workspace/europe.yaml'); }

function audit(event) { console.log(JSON.stringify({time: new Date().toISOString(), ...event})); }
async function kubectl(args) {
  const id = randomUUID();
  const argv = ['--kubeconfig', kubeconfig, '--request-timeout=15s', ...args];
  audit({id, event: 'command-start', command: ['kubectl', ...argv].map(s => "'" + s.replaceAll("'", "'\\''") + "'").join(' ')});
  try {
    const {stdout, stderr} = await exec('kubectl', argv, {env, timeout: 40000, maxBuffer: 1024 * 1024});
    // These fixed commands read only nodes, namespaces and the lesson ConfigMap.
    audit({id, event: 'command-end', exitCode: 0, stdout, stderr});
    return stdout;
  } catch (error) {
    audit({id, event: 'command-end', exitCode: error.code ?? 1, stderr: error.stderr ?? error.message});
    throw new Error('Kubernetes command failed. Check workshop logs and cluster status.');
  }
}
async function getResource(args) {
  const text = await kubectl(['get', ...args, '--ignore-not-found', '-o', 'json']);
  return text.trim() ? JSON.parse(text) : null;
}
const staticFiles = new Map([
  ['/', ['web/dpu101.html', 'text/html']],
  ['/manual-dpu', ['web/manual-dpu.html', 'text/html']],
  ['/manual-dpu.js', ['web/manual-dpu.js', 'text/javascript']],
  ['/manual-dpu-model.mjs', ['web/manual-dpu-model.mjs', 'text/javascript']],
  ['/manual-dpu.css', ['web/manual-dpu.css', 'text/css']],
  ['/dpu-config', ['web/dpu-config.html', 'text/html']],
  ['/dpu-config.js', ['web/dpu-config.js', 'text/javascript']],
  ['/dpu-config-data.js', ['web/dpu-config-data.js', 'text/javascript']],
  ['/dpu-config.css', ['web/dpu-config.css', 'text/css']],
  ['/yaml-examples.json', ['web/yaml-examples.json', 'application/json']],
  ['/host-ubuntu', ['web/host-ubuntu.html', 'text/html']],
  ['/host-ubuntu.js', ['web/host-ubuntu.js', 'text/javascript']],
  ['/host-ubuntu-model.mjs', ['web/host-ubuntu-model.mjs', 'text/javascript']],
  ['/host-ubuntu.css', ['web/host-ubuntu.css', 'text/css']],
  ['/kubernetes', ['web/index.html', 'text/html']],
  ['/dpu101.css', ['web/dpu101.css', 'text/css']],
  ['/dpu101.js', ['web/dpu101.js', 'text/javascript']],
  ['/guide-diagrams.js', ['web/guide-diagrams.js', 'text/javascript']],
  ['/guide-diagrams.css', ['web/guide-diagrams.css', 'text/css']],
  ['/images/dpu-board-reference-1.png', ['web/images/dpu-board-reference-1.png', 'image/png']],
  ['/images/dpu-board-reference-2.png', ['web/images/dpu-board-reference-2.png', 'image/png']],
  ['/images/dpu-board-photo.png', ['web/images/dpu-board-photo.png', 'image/png']],
  ['/course.css', ['web/course.css', 'text/css']],
  ['/course-nav.js', ['web/course-nav.js', 'text/javascript']],
  ['/fonts/nvidia-sans-regular.woff2', ['web/fonts/nvidia-sans-regular.woff2', 'font/woff2']],
  ['/fonts/nvidia-sans-bold.woff2', ['web/fonts/nvidia-sans-bold.woff2', 'font/woff2']],
  ['/app.js', ['web/app.js', 'text/javascript']],
  ['/style.css', ['web/style.css', 'text/css']],
  ['/xterm.js', ['node_modules/@xterm/xterm/lib/xterm.js', 'text/javascript']],
  ['/xterm.css', ['node_modules/@xterm/xterm/css/xterm.css', 'text/css']],
  ['/fit.js', ['node_modules/@xterm/addon-fit/lib/addon-fit.js', 'text/javascript']],
]);
let resetting = false;
const server = createServer(async (req, res) => {
  const reply = (status, data) => { res.writeHead(status, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(data)); };
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'");
  if (!/^(localhost|127\.0\.0\.1):[0-9]+$/.test(req.headers.host || '')) return reply(403, {error: 'Use localhost or 127.0.0.1 through the SSH tunnel.'});
  if (req.method === 'POST' && !allowedRequest(req.headers.host, req.headers.origin)) return reply(403, {error: 'Origin rejected.'});
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      const nodes = JSON.parse(await kubectl(['get', 'nodes', '-o', 'json'])).items;
      const ready = nodes.length >= 2 && nodes.every(n => n.status.conditions.some(c => c.type === 'Ready' && c.status === 'True'));
      return reply(ready ? 200 : 503, {ready, cluster: 'kind-dpf-training', nodes: nodes.map(n => n.metadata.name), version: '0.1.0'});
    }
    if (req.method === 'POST' && req.url === '/api/check') {
      if (resetting) return reply(409, {error: 'Reset in progress.'});
      const ns = await getResource(['namespace', 'tenant-europe']);
      const cm = ns ? await getResource(['configmap', 'lab-identity', '-n', 'tenant-europe']) : null;
      return reply(200, gradeLesson(ns, cm));
    }
    if (req.method === 'POST' && req.url === '/api/reset') {
      if (resetting) return reply(409, {error: 'Reset in progress.'});
      resetting = true;
      try {
        await kubectl(['delete', 'namespace', 'tenant-europe', '--ignore-not-found', '--wait=true', '--timeout=30s']);
        await copyFile('/app/lessons/europe.yaml', '/workspace/europe.yaml');
        return reply(200, {reset: true, message: 'Europe namespace deleted; europe.yaml restored. Ready to retry.'});
      } finally { resetting = false; }
    }
    if (req.method === 'GET' && staticFiles.has(req.url)) {
      const [path, mime] = staticFiles.get(req.url);
      res.writeHead(200, {'Content-Type': mime, 'Cache-Control': 'no-cache'});
      return res.end(await readFile(new URL(path, import.meta.url)));
    }
    reply(404, {error: 'Not found.'});
  } catch (error) { reply(503, {error: error.message}); }
});

const wss = new WebSocketServer({noServer: true, maxPayload: 64 * 1024});
server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/ws/term' || !allowedRequest(req.headers.host, req.headers.origin) || wss.clients.size >= 4) {
    socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
  }
  wss.handleUpgrade(req, socket, head, ws => {
    let shell;
    try {
      shell = pty.spawn('/bin/bash', ['--rcfile', '/app/bin/labrc', '-i'], {name: 'xterm-256color', cols: 100, rows: 28, cwd: '/workspace', env});
    } catch { ws.close(1011, 'Shell could not start'); return; }
    shell.onData(data => { if (ws.readyState === WebSocket.OPEN) ws.send(data); });
    shell.onExit(() => ws.close());
    ws.on('message', raw => {
      const message = raw.toString();
      if (message.startsWith('\x00resize:')) {
        const [, columns, rows] = message.split(':').map(Number);
        if (Number.isInteger(columns) && Number.isInteger(rows) && columns >= 10 && columns <= 500 && rows >= 5 && rows <= 200) {
          try { shell.resize(columns, rows); } catch { /* Shell may have exited. */ }
        }
      } else { try { shell.write(message); } catch { ws.close(); } }
    });
    let alive = true;
    ws.on('pong', () => { alive = true; });
    const heartbeat = setInterval(() => { if (!alive) return ws.terminate(); alive = false; ws.ping(); }, 20000);
    ws.on('error', () => ws.terminate());
    ws.on('close', () => { clearInterval(heartbeat); try { shell.kill(); } catch {} });
  });
});
server.listen(3000, '0.0.0.0', () => audit({event: 'ready', port: 3000, cluster: 'kind-dpf-training'}));
process.on('SIGTERM', () => { for (const ws of wss.clients) ws.terminate(); server.close(() => process.exit(0)); });
