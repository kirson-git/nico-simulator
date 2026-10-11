import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
 await page.goto('http://127.0.0.1:8780/#modes');
 await page.getByRole('button',{name:'Original PNG animation',exact:true}).click();
 await page.locator('#mode-photo img').waitFor({timeout:5000});
 await page.locator('#mode-photo img').evaluate(img=>img.decode());
 assert.equal(await page.locator('#mode-photo img').getAttribute('src'),'/images/dpu-board-reference-2.png');
 await page.getByRole('button',{name:'NIC mode',exact:true}).click();
 assert.equal(await page.locator('#mode-photo').getAttribute('data-mode'),'nic');
 assert.equal(await page.locator('#mode-arm').getAttribute('data-active'),'false');
 await page.getByRole('checkbox',{name:'Show original PNG'}).check();
 assert.equal(await page.locator('#mode-photo').getAttribute('data-original'),'true');
 assert.equal(await page.locator('.photo-overlay').first().isVisible(),false);
 await page.getByRole('button',{name:'DPU mode',exact:true}).click();
 assert.equal(await page.getByRole('checkbox',{name:'Show original PNG'}).isChecked(),false);
 assert.equal(await page.locator('#mode-photo').getAttribute('data-mode'),'dpu');
 await page.getByRole('button',{name:'Next packet step'}).click();
 assert.equal(await page.locator('#packet-track').getAttribute('data-step'),'1');
 for(const mode of ['DPU mode','NIC mode']) {
  await page.getByRole('button',{name:mode,exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`/test/png-${mode.split(' ')[0]}.png`,fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'DPU mode',exact:true}).click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'/test/png-mobile.png',fullPage:true});
 await page.goto('http://127.0.0.1:8780/#inside');
 assert.equal(await page.locator('[data-board-panel]:not([hidden]) img').getAttribute('src'),'/images/dpu-board-reference-1.png');
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 console.log('PASS: exact PNG defaults, DPU/NIC overlays, original-only view, on-image packet steps and mobile layout.');
} finally {await browser.close();}
