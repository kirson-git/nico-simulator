import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const requests=[];page.on('request',r=>requests.push([r.method(),r.url()]));
 await page.goto('http://127.0.0.1:8780/');
 await page.locator('#chapters a[href="/#software"]').click();
 await page.getByRole('link',{name:'Open the later host Ubuntu rehearsal'}).click();
 await page.getByRole('button',{name:'Check my work'}).click();
 assert.match(await page.locator('#result').innerText(),/Keep going/);
 for(const name of ['Verify ISO','Review YAML','Mount ISO','Set one-time boot','Restart simulated server'])await page.getByRole('button',{name,exact:true}).click();
 await page.getByRole('button',{name:'Try wrong server'}).click();
 await page.getByRole('button',{name:'Run guarded installation'}).click();
 assert.match(await page.locator('#console').innerText(),/Resolve the disk guard failure/);
 assert.equal(await page.locator('#recover').isDisabled(),true);
 await page.getByRole('button',{name:'Select correct target'}).click();
 await page.getByRole('button',{name:'Try PERC serial mismatch'}).click();
 assert.match(await page.locator('#console').innerText(),/matched no disk/);
 await page.screenshot({path:'/test/host-ubuntu-recovery.png'});
 await page.getByRole('button',{name:'Apply guarded recovery'}).click();
 await page.getByRole('button',{name:'Verify installed Ubuntu'}).click();
 await page.getByRole('button',{name:'Check my work'}).click();
 assert.match(await page.locator('#result').innerText(),/Keep going/);
 await page.getByRole('button',{name:'Eject DVD'}).click();
 await page.getByRole('button',{name:'Check my work'}).click();
 assert.match(await page.locator('#result').innerText(),/Lesson complete/);
 assert.equal(await page.locator('#handoff').isVisible(),true);
 assert.match(await page.locator('#handoff').innerText(),/HBN is not deployed/);
 await page.screenshot({path:'/test/host-ubuntu-complete.png'});
 for(const viewport of [{width:820,height:650},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow');
 }
 await page.screenshot({path:'/test/host-ubuntu-mobile.png'});
 await page.getByRole('button',{name:'Reset lesson'}).click();
 assert.match(await page.locator('#progress').innerText(),/0 \/ 8/);
 assert.equal(await page.locator('#handoff').isVisible(),false);
 assert.equal(requests.filter(([m])=>m!=='GET').length,0,'simulation must never send mutation requests');
 assert.ok(requests.every(([,url])=>url.startsWith('http://127.0.0.1:8780/')),'no hardware requests');
 assert.deepEqual(errors,[]);
 console.log('PASS: ordered install, identity refusal, PERC recovery, verification before success, media cleanup, HBN boundary, reset and mobile layout; no mutation or external requests.');
} finally {await browser.close();}
