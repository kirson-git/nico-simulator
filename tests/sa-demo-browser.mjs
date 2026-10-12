import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[],writes=[],sockets=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());if(new URL(r.url()).hostname!=='127.0.0.1')external.push(r.url());});
 page.on('websocket',ws=>sockets.push(ws.url()));
 const response=await page.goto('http://127.0.0.1:8780/sa-demo');
 assert.equal(response.status(),200);
 await page.getByRole('heading',{name:'One DPU is a project. A fleet needs a platform.'}).waitFor();
 assert.equal(await page.locator('#sa-prev').isDisabled(),true);
 assert.ok(await page.locator('#sa-slide img').evaluate(el=>el.complete&&el.naturalWidth>0));
 for(const id of ['rack','fleet','selection','tenants','layers','services','rollout','paths','lifecycle','future']) {
   await page.locator(`#sa-topics a[href="#${id}"]`).click();
   await page.waitForFunction(id=>document.querySelector('#sa-slide').dataset.slide===id,id);
   await page.screenshot({path:`/test/sa-scene-${id}.png`,fullPage:true});
 }
 assert.equal(await page.locator('#sa-next').isDisabled(),true);
 await page.locator('#sa-topics a[href="#rack"]').click();
 await page.waitForFunction(()=>document.querySelector('#sa-slide').dataset.slide==='rack');
 assert.equal(await page.locator('.sa-tray em').count(),18);
 assert.ok((await page.locator('.sa-tray em').allTextContents()).every(text=>text==='1 DPU'));
 assert.match(await page.locator('#sa-slide').innerText(),/GB300/);
 await page.locator('#sa-topics a[href="#fleet"]').click();
 await page.waitForFunction(()=>document.querySelector('#sa-slide').dataset.slide==='fleet');
 assert.equal(await page.locator('[data-management-node]').count(),3);
 assert.ok(await page.locator('.gd-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth),'Full diagram fits desktop');
 for(let step=1;step<=5;step++){
   await page.getByRole('button',{name:'Next step',exact:true}).click();
   assert.equal(await page.locator('[data-guide-diagram]').getAttribute('data-step'),String(step));
 }
 await page.screenshot({path:'/test/sa-fleet-ready.png',fullPage:true});
 await page.locator('.sa-platform-details > summary').first().click();
 for(const word of ['cert-manager','Argo CD','Kamaji','Node Feature Discovery','Maintenance Operator'])assert.ok((await page.locator('#sa-slide').innerText()).includes(word));
 await page.locator('#sa-topics a[href="#layers"]').click();
 await page.waitForFunction(()=>document.querySelector('#sa-slide').dataset.slide==='layers');
 await page.locator('.sa-source-image summary').click();
 assert.ok(await page.locator('.sa-source-image img').evaluate(el=>el.complete&&el.naturalWidth>0));
 await page.locator('#sa-topics a[href="#selection"]').click();
 await page.locator('.sa-yaml-full > summary').click();
 const before=await page.locator('#sa-fleet-yaml').innerText();
 await page.getByRole('button',{name:'Play animation',exact:true}).click();
 await page.getByRole('button',{name:'Detailed telemetry',exact:true}).click();
 const after=await page.locator('#sa-fleet-yaml').innerText();
 assert.equal(await page.locator('[data-guide-diagram] svg').evaluate(el=>el.animationsPaused()),true);
 assert.equal(await page.locator('[data-guide-diagram]').getAttribute('data-step'),'0');
 await page.screenshot({path:'/test/sa-fleet-yaml.png',fullPage:true});
 assert.equal(after,before.replace('telemetry-baseline','telemetry-detailed'),'Only the service configuration reference changes');
 assert.ok((await page.locator('#sa-fleet-intent').innerText()).includes('36 DPUs'));
 assert.equal(await page.locator('[data-rack-selected="true"]').count(),2);
 assert.equal(await page.locator('[data-rack-selected="false"]').count(),1);
 await page.getByRole('button',{name:'Baseline telemetry',exact:true}).click();
 assert.equal(await page.locator('#sa-fleet-yaml').innerText(),before);
 await page.locator('#sa-topics a[href="#services"]').click();
 for(const id of ['hbn','argus','snap','dts']) {
   await page.locator(`[data-service="${id}"]`).click();
   assert.equal(await page.locator(`[data-service="${id}"]`).getAttribute('aria-pressed'),'true');
   assert.ok((await page.locator('#sa-service-detail').innerText()).length>100);
 }
 await page.locator('#sa-notes-toggle').click();assert.ok(await page.locator('#sa-notes').isVisible());
 await page.locator('#sa-present').click();assert.equal(await page.locator('body').getAttribute('data-presenting'),'true');
 await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>document.querySelector('#sa-slide').dataset.slide==='rollout',null,{timeout:3000});
 await page.keyboard.press('Escape');assert.equal(await page.locator('body').getAttribute('data-presenting'),'false');
 for(const id of ['fleet','selection','tenants','rollout','paths']) {
   await page.locator(`#sa-topics a[href="#${id}"]`).click();
   const diagram=page.locator('[data-guide-diagram]');
   assert.equal(await diagram.locator('svg').evaluate(el=>el.animationsPaused()),true);
   await diagram.getByRole('button',{name:'Play animation',exact:true}).click();await page.waitForTimeout(400);
   await diagram.getByRole('button',{name:'Pause animation'}).click();
   const time=await diagram.locator('svg').evaluate(el=>el.getCurrentTime());
   await page.waitForTimeout(150);assert.ok(Math.abs(await diagram.locator('svg').evaluate(el=>el.getCurrentTime())-time)<.03);
   await diagram.getByRole('button',{name:'Next step',exact:true}).click();assert.equal(await diagram.getAttribute('data-step'),'1');
   await diagram.getByRole('button',{name:'Replay animation'}).click();assert.equal(await diagram.getAttribute('data-step'),'0');
   await page.screenshot({path:`/test/sa-${id}.png`,fullPage:true});
   await diagram.getByRole('button',{name:'Play animation',exact:true}).click();
   const oldSvg=await diagram.locator('svg').elementHandle();
   await page.locator('#sa-topics a[href="#why"]').click();
   await page.waitForFunction(()=>document.querySelector('#sa-slide').dataset.slide==='why');
   assert.equal(await oldSvg.evaluate(el=>el.animationsPaused()),true);
 }
 await page.goto('http://127.0.0.1:8780/sa-demo#rollout');await page.reload();
 await page.locator('[data-guide-diagram]').waitFor();
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Play animation',exact:true}).click();
 assert.equal(await page.locator('[data-guide-diagram]').getAttribute('data-step'),'1');
 assert.equal(await page.locator('[data-guide-diagram] svg').evaluate(el=>el.animationsPaused()),true);
 await page.locator('#sa-title').focus();await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>location.hash==='#paths');await page.goBack();
 await page.waitForFunction(()=>document.querySelector('#sa-slide').dataset.slide==='rollout');
 for(const width of [820,390]) {
   await page.setViewportSize({width,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const region=page.locator('.gd-scroll');await region.focus();await page.keyboard.press('ArrowRight');
   if(width===390){await page.waitForTimeout(150);assert.ok(await region.evaluate(el=>el.scrollLeft>0));}
   assert.equal(await page.locator('#sa-slide').getAttribute('data-slide'),'rollout');
   if(width===390){
     await page.locator('#course-menu > summary').click();
     const summary=await page.locator('#course-menu > summary').boundingBox();
     const catalog=await page.locator('#course-menu .catalog-body').boundingBox();
     assert.ok(catalog.y>=summary.y+summary.height-1,'Course menu expands beneath its summary');
     await page.locator('#course-menu > summary').click();
   }
   await page.screenshot({path:`/test/sa-mobile-${width}.png`,fullPage:true});
 }
 for(const id of ['layers','rack','fleet','selection','tenants']) {
   await page.goto('http://127.0.0.1:8780/sa-demo#'+id);
   await page.waitForFunction(id=>document.querySelector('#sa-slide').dataset.slide===id,id);
   if(id==='selection')await page.locator('.sa-yaml-full > summary').click();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile overflow');
   await page.screenshot({path:`/test/sa-${id}-390.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(sockets,[]);assert.deepEqual(external,[]);
 console.log('PASS: SA presentation slides, services, speaker notes, presenter mode, shared playback/disposal, deep links, mobile and no mutations.');
} finally {await browser.close();}
