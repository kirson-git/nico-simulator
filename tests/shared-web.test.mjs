import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {createSharedServer} from '../shared-server.mjs';

test('shared course serves simulations but exposes no terminal, APIs or private files', async () => {
 const server=createSharedServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try {
  for(const path of ['/','/sa-demo','/manual-dpu','/dpu-config','/host-ubuntu']) {
   const response=await fetch(base+path);
   assert.equal(response.status,200,path);
   assert.match(await response.text(),/name="course-mode" content="shared"/);
  }
  assert.equal((await fetch(base+'/sa-demo-fleet.js')).status,200);
  const lab=await (await fetch(base+'/kubernetes')).text();
  assert.match(lab,/Live Kubernetes lab/);
  assert.doesNotMatch(lab,/app.js|xterm.js/);
  for(const path of ['/api/health','/api/reset','/ws/term','/.runtime/kubeconfig.json','/server.mjs','/app.js','/xterm.js','/missing'])assert.equal((await fetch(base+path)).status,404,path);
  assert.equal((await fetch(base+'/sa-demo',{method:'POST'})).status,405);
  const upgrade=await new Promise((resolve,reject)=>{
   const req=request(base+'/ws/term',{headers:{Connection:'Upgrade',Upgrade:'websocket'}},res=>{res.resume();resolve(res.statusCode);});
   req.on('upgrade',(_res,socket)=>{socket.destroy();reject(new Error('WebSocket unexpectedly accepted'));});
   req.on('error',reject);req.setTimeout(2000,()=>req.destroy(new Error('Upgrade timeout')));req.end();
  });
  assert.equal(upgrade,403);
  const head=await fetch(base+'/sa-demo',{method:'HEAD'});
  assert.equal(head.status,200);assert.equal(await head.text(),'');
 } finally {await new Promise(resolve=>server.close(resolve));}
});
