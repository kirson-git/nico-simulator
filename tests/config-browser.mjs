// The YAML guide must remain read-only, with every bundled file inspectable.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
 const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const writes=[],errors=[],external=[];
 page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
 page.on('request',r=>{if(new URL(r.url()).hostname!=='127.0.0.1')external.push(r.url());});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8780/dpu-config#flavor');
 await page.getByRole('heading',{name:'DPUFlavor: the DPU configuration blueprint',exact:true}).waitFor({timeout:5000});
 await page.context().grantPermissions(['clipboard-read','clipboard-write'],{origin:'http://127.0.0.1:8780'});
 await page.getByRole('button',{name:'Copy YAML',exact:true}).click();
 await page.getByText('YAML copied.',{exact:true}).waitFor();
 assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/^# Europe lab extension[\s\S]*kind: DPUFlavor/);
 assert.equal(await page.locator('[data-course-nav] a[aria-current="page"]').getAttribute('href'),'/dpu-config');
 await page.getByRole('button',{name:'configFiles — files inside Ubuntu',exact:true}).click();
 assert.match(await page.locator('#field-explanation').innerText(),/60-europe-lab-dns.yaml/);
 assert.match(await page.locator('#yaml-code .selected-line').first().innerText(),/configFiles/);
 assert.equal(await page.locator('[data-target="os"]').getAttribute('data-active'),'true');
 for(const [id,kind] of [['operator','DPFOperatorConfig'],['discovery','DPUDiscovery'],['europe','DPUCluster'],['asia','DPUCluster'],['bfb','BFB'],['flavor','DPUFlavor'],['networking','DPUServiceChain'],['dpuset','DPUSet']]) {
  await page.locator(`#yaml-files a[href="#${id}"]`).click();
  await page.waitForFunction(id=>document.querySelector('#yaml-code')?.dataset.file===id,id);
  assert.match(await page.locator('#yaml-code').innerText(),new RegExp(`kind: ${kind}`));
  assert.doesNotMatch(await page.locator('#yaml-code').innerText(),/192\.168\.0\.|10\.220\.175\.|MT251760/);
  for(const button of await page.locator('.field-buttons button').all()) {
   await button.click();
   assert.equal(await page.locator('#yaml-code .selected-line').count(),1);
   assert.equal(await page.locator('.impact-target[data-active="true"]').count(),1);
   assert.ok((await page.locator('#field-explanation p').innerText()).length>40);
  }
  if(id==='europe'||id==='asia') {
   await page.getByRole('button',{name:`labels — ${id==='europe'?'Europe':'Asia'} selection`,exact:true}).click();
   assert.ok(await page.locator('#yaml-code').evaluate(code=>{
    const lines=[...code.children];
    return lines.indexOf(code.querySelector('.selected-line'))>lines.findIndex(line=>line.textContent.includes('kind: DPUCluster'));
   }),'Tenant selection must highlight the DPUCluster label, not the Namespace label');
  }
 }
 await page.goBack();
 await page.waitForFunction(()=>document.querySelector('#yaml-code')?.dataset.file==='networking');
 await page.reload();
 await page.getByRole('heading',{name:'Interfaces and service chain: connect the ports',exact:true}).waitFor();
 await page.goto('http://127.0.0.1:8780/dpu-config#flavor');
 await page.getByRole('heading',{name:'DPUFlavor: the DPU configuration blueprint',exact:true}).waitFor();
 await page.screenshot({path:'/test/config-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.locator('#yaml-files a[href="#dpuset"]').click();
 await page.waitForFunction(()=>document.querySelector('#yaml-code')?.dataset.file==='dpuset');
 await page.getByRole('button',{name:'nodeEffect.hold — initial provisioning gate',exact:true}).click();
 assert.match(await page.locator('#field-explanation').innerText(),/held/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'/test/config-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 assert.deepEqual(writes,[]);
 assert.deepEqual(external,[]);
 console.log('PASS: all eight YAMLs, field-to-DPU mapping, fictional identities, sidebar, Back/reload, mobile layout and no mutations.');
} finally {await browser.close();}
