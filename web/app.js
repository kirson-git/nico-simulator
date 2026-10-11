const terminal = new Terminal({cursorBlink: true, fontSize: 13, fontFamily: 'Menlo, Consolas, monospace', theme: {background: '#090d12', foreground: '#d6e2f0', cursor: '#b0ed68'}, scrollback: 5000});
const fit = new FitAddon.FitAddon();
terminal.loadAddon(fit);
terminal.open(document.getElementById('terminal'));
let socket;
function resize() {
  fit.fit();
  if (socket?.readyState === WebSocket.OPEN) socket.send(`\x00resize:${terminal.cols}:${terminal.rows}`);
}
function connect() {
  if (socket) { socket.onclose = null; socket.close(); }
  socket = new WebSocket(`ws://${location.host}/ws/term`);
  socket.onopen = () => { document.getElementById('connection').textContent = '● Connected · real Bash'; resize(); terminal.focus(); };
  socket.onmessage = event => terminal.write(event.data);
  socket.onclose = () => { document.getElementById('connection').textContent = 'Disconnected · use Reconnect'; };
  socket.onerror = () => { document.getElementById('connection').textContent = 'Connection failed · check tunnel'; };
}
terminal.onData(data => { if (socket?.readyState === WebSocket.OPEN) socket.send(data); });
terminal.attachCustomKeyEventHandler(event => {
  if (event.type === 'keydown' && (event.metaKey || (event.ctrlKey && event.shiftKey)) && event.key.toLowerCase() === 'c' && terminal.hasSelection()) {
    navigator.clipboard.writeText(terminal.getSelection()).catch(() => {});
    return false;
  }
  return true;
});
new ResizeObserver(resize).observe(document.getElementById('terminal'));
document.getElementById('reconnect').onclick = connect;
document.querySelectorAll('[data-command]').forEach(button => button.onclick = () => {
  if (socket?.readyState !== WebSocket.OPEN) return;
  socket.send('\x15' + button.dataset.command); terminal.focus();
});
const result = document.getElementById('result');
const check = document.getElementById('check');
const reset = document.getElementById('reset');
async function action(path) {
  check.disabled = reset.disabled = true;
  result.textContent = path === 'reset' ? 'Resetting the Europe exercise…' : 'Reading the live Kubernetes resources…';
  try {
    const response = await fetch(`/api/${path}`, {method: 'POST'});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    result.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = data.reset ? data.message : data.passed ? '✓ Lesson complete. Your YAML is working!' : 'Keep going — check the items below.';
    title.className = data.reset || data.passed ? 'pass' : 'fail';
    result.append(title);
    if (data.checks) {
      const list = document.createElement('ul');
      for (const item of data.checks) {
        const row = document.createElement('li'); row.textContent = `${item.passed ? '✓' : '○'} ${item.label}`; row.className = item.passed ? 'pass' : 'fail'; list.append(row);
      }
      result.append(list);
    }
  } catch (error) { result.textContent = error.message; }
  finally { check.disabled = reset.disabled = false; }
}
check.onclick = () => action('check');
reset.onclick = () => {
  if (confirm('Delete tenant-europe and everything inside it, and restore europe.yaml? Other training namespaces are kept.')) action('reset');
};
async function health() {
  try {
    const response = await fetch('/api/health'); const data = await response.json();
    document.getElementById('health').textContent = response.ok && data.ready ? '● kind-dpf-training · 2 nodes Ready' : 'Cluster needs attention · check logs';
  } catch { document.getElementById('health').textContent = 'Workshop unreachable'; }
}
connect(); health(); setInterval(health, 30000);
