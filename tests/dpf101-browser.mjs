import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],writes=[],sockets=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
  page.on('websocket',ws=>sockets.push(ws.url()));
  await page.goto('http://127.0.0.1:8780/dpf101');
  await page.getByRole('heading',{name:'Why do we need DPF?'}).waitFor();
  assert.equal(await page.locator('[data-course-nav] a[aria-current="page"]').getAttribute('href'),'/dpf101');
  const links=await page.locator('[data-course-nav] a').evaluateAll(els=>els.map(el=>el.getAttribute('href')));
  assert.ok(links.indexOf('/dpf101')<links.indexOf('/manual-dpu'));
  assert.match(await page.locator('main').innerText(),/When might you skip it/);
  assert.match(await page.locator('main').innerText(),/does not create isolation/);
  await page.locator('.dpf-terms summary').click();
  await page.getByText('DPUFlavor / DPUSet',{exact:true}).waitFor();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'/test/dpf101-desktop.png',fullPage:true});
  await page.locator('.dpf-next a[href="/manual-dpu"]').click();
  await page.getByRole('heading',{name:'One DPU. From OS to HBN.'}).waitFor();
  await page.goBack();
  await page.reload();
  await page.getByRole('heading',{name:'Why do we need DPF?'}).waitFor();
  for(const width of [820,390]) {
    await page.setViewportSize({width,height:844});
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const region=page.getByRole('region',{name:/DPF management architecture/});
    await region.focus();await page.keyboard.press('ArrowRight');
    if(width===390){await page.waitForTimeout(200);assert.ok(await region.evaluate(el=>el.scrollLeft>0));}
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`/test/dpf101-${width}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(sockets,[]);
  console.log('PASS: DPF intro, sidebar order, navigation/reload, glossary, readable mobile diagram, no writes or terminal connections.');
} finally {await browser.close();}
