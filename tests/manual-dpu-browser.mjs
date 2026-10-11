import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[],writes=[],sockets=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());if(new URL(r.url()).hostname!=='127.0.0.1')external.push(r.url());});
  page.on('websocket',ws=>sockets.push(ws.url()));
  await page.goto('http://127.0.0.1:8780/manual-dpu');
  await page.getByRole('heading',{name:'One DPU. From OS to HBN.'}).waitFor();
  assert.equal(await page.locator('[data-course-nav] a[aria-current="page"]').getAttribute('href'),'/manual-dpu');
  assert.match(await page.locator('.manual-boundary').innerText(),/not a verified BF4/);
  assert.ok(await page.locator('#manual-next').isDisabled());
  const terminalBox=await page.locator('.manual-terminal').boundingBox();
  const explanationBox=await page.locator('.manual-step').boundingBox();
  assert.ok(terminalBox.y<explanationBox.y);
  assert.ok(terminalBox.y<500, 'Terminal should appear near the top');
  await page.locator('.manual-background summary').click();
  assert.match(await page.locator('.manual-background').innerText(),/What is a DPU\?/);
  const diagram=page.locator('[data-guide-diagram="manual"]');
  await diagram.getByRole('button',{name:'Play animation',exact:true}).click();
  await page.waitForTimeout(500);
  await diagram.getByRole('button',{name:'Pause animation'}).click();
  const t=await diagram.locator('svg').evaluate(el=>el.getCurrentTime());
  assert.ok(t>.1);
  await page.waitForTimeout(200);
  assert.ok(Math.abs(await diagram.locator('svg').evaluate(el=>el.getCurrentTime())-t)<.02);
  await diagram.getByRole('button',{name:'Replay animation'}).click();
  await diagram.getByRole('button',{name:'Play animation',exact:true}).click();
  await page.locator('.manual-background summary').click();
  await page.waitForTimeout(50);
  assert.equal(await diagram.locator('svg').evaluate(el=>el.animationsPaused()),true);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'/test/manual-dpu-desktop.png',fullPage:true});
  await page.locator('#manual-load').click();
  await page.locator('#manual-target').selectOption('arm');
  await page.getByRole('button',{name:'Run command',exact:true}).click();
  assert.match(await page.locator('#manual-result').innerText(),/Wrong terminal/);
  assert.match(await page.locator('#manual-progress').innerText(),/^0 \/ 18/);
  await page.locator('#manual-target').selectOption('host');
  for(let i=0;i<18;i++) {
    const title=await page.locator('#manual-title').innerText();
    assert.ok((await page.locator('#manual-expected').innerText()).length>40);
    await page.locator('#manual-load').click();
    await page.getByRole('button',{name:'Run command',exact:true}).click();
    assert.match(await page.locator('#manual-progress').innerText(),new RegExp(`^${i+1} / 18`));
    assert.equal(await page.locator('#manual-title').innerText(),title, 'Explanation must stay until Next');
    assert.ok(await page.locator('#manual-load').isDisabled());
    if(i===0){
      await page.locator('#manual-input').fill('cat /etc/os-release');
      await page.getByRole('button',{name:'Run command',exact:true}).click();
      assert.match(await page.locator('#manual-progress').innerText(),/^1 \/ 18/);
    }
    if(i<17) await page.locator('#manual-next').click();
    else assert.ok(await page.locator('#manual-next').isDisabled());
  }
  await page.locator('#manual-check').click();
  assert.match(await page.locator('#manual-result').innerText(),/^Lesson complete/);
  assert.ok(await page.locator('#manual-handoff').isVisible());
  const download=page.waitForEvent('download');
  await page.locator('#manual-export').click();
  const file=await download; assert.equal(file.suggestedFilename(),'manual-dpu-simulated-transcript.txt');
  const stream=await file.createReadStream();let transcript='';for await(const chunk of stream)transcript+=chunk;
  assert.match(transcript,/AUTHORED SIMULATED OUTPUT/);assert.match(transcript,/host RShim unavailable/);
  await page.locator('#manual-reset').click();
  await page.locator('#manual-input').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button',{name:'Run command',exact:true}).click();
  assert.equal(await page.locator('#manual-console img').count(),0);
  await page.locator('#manual-reset').click();
  assert.match(await page.locator('#manual-progress').innerText(),/^0 \/ 18/);
  assert.equal(await page.locator('#manual-handoff').isVisible(),false);
  await page.locator('.manual-recovery summary').click();
  await page.locator('#manual-nic').click();
  await page.locator('#manual-load').click();await page.getByRole('button',{name:'Run command',exact:true}).click();
  assert.match(await page.locator('#manual-result').innerText(),/NIC mode/);
  const [setMode,powerCycle]=(await page.locator('#manual-recovery-command').innerText()).split('\n');
  for(const command of [setMode,powerCycle]) {await page.locator('#manual-input').fill(command);await page.getByRole('button',{name:'Run command',exact:true}).click();}
  await page.locator('#manual-load').click();await page.getByRole('button',{name:'Run command',exact:true}).click();
  assert.match(await page.locator('#manual-progress').innerText(),/^1 \/ 18/);
  await page.reload();
  assert.match(await page.locator('#manual-progress').innerText(),/^0 \/ 18/);
  await page.locator('.manual-background summary').click();
  await page.emulateMedia({reducedMotion:'reduce'});
  await diagram.getByRole('button',{name:'Play animation',exact:true}).click();
  assert.equal(await diagram.getAttribute('data-step'),'1');
  assert.equal(await diagram.locator('svg').evaluate(el=>el.animationsPaused()),true);
  await page.locator('.manual-recovery summary').click();
  for(const width of [820,390]) {
    await page.setViewportSize({width,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const region=diagram.getByRole('region');await region.focus();await page.keyboard.press('ArrowRight');
    if(width===390){await page.waitForTimeout(200);assert.ok(await region.evaluate(el=>el.scrollLeft>0));}
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`/test/manual-dpu-${width}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(sockets,[]);assert.deepEqual(external,[]);
  console.log('PASS: manual CLI, 18 checks, terminal guards, NIC reset, transcript, safe text rendering, mobile/reduced motion; no network mutations or real terminal.');
} finally {await browser.close();}
