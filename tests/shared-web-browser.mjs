import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.COURSE_URL || 'http://127.0.0.1:8782';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 const errors=[],writes=[],sockets=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
 page.on('websocket',s=>sockets.push(s.url()));
 await page.goto(base+'/sa-demo#fleet');
 await page.getByRole('button',{name:'Detailed telemetry',exact:true}).click();
 assert.match(await page.locator('#sa-fleet-intent').innerText(),/detailed telemetry/);
 await page.getByRole('button',{name:'Play animation',exact:true}).click();
 await page.getByRole('button',{name:'Pause animation',exact:true}).click();
 await page.locator('.course-topics a[href="/kubernetes"]').click();
 await page.getByRole('heading',{name:'Live Kubernetes lab',exact:true}).waitFor();
 assert.match(await page.locator('.course-topics a[href="/kubernetes"]').innerText(),/Local lab required/);
 assert.equal(await page.locator('.xterm').count(),0);
 await page.screenshot({path:'/test/shared-lab.png',fullPage:true});
 for(const path of ['/manual-dpu','/host-ubuntu','/dpu-config']) {
  const response=await page.goto(base+path);assert.equal(response.status(),200);
  await page.locator('main h1, main h2').first().waitFor();
 }
 assert.equal((await page.request.get(base+'/api/health')).status(),404);
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(sockets,[]);
 console.log('PASS: direct web course, fleet controls, shared lab explanation, simulated lessons, no live APIs or terminal.');
} finally {await browser.close();}
