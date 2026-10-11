// User interactions only. Never create/reset Kubernetes resources.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  const errors = [], writes = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => {if (r.method() !== 'GET') writes.push(r.url());});
  await page.goto('http://127.0.0.1:8780/#modes');
  const diagram = page.locator('[data-guide-diagram="modes"]');
  await diagram.waitFor({timeout: 5000});
  const svg = diagram.locator('svg');
  assert.equal(await svg.evaluate(el => el.animationsPaused()), true);
  await diagram.getByRole('button', {name: 'Next step'}).click();
  assert.match(await diagram.locator('[data-guide-caption]').innerText(), /hardware/);
  await diagram.getByRole('button', {name: 'Play animation', exact: true}).click();
  await page.waitForTimeout(650);
  await diagram.getByRole('button', {name: 'Pause animation'}).click();
  const time = await svg.evaluate(el => el.getCurrentTime());
  assert.ok(time > 3.1, "Play advances the native SVG timeline");
  await page.waitForTimeout(300);
  assert.ok(Math.abs(await svg.evaluate(el => el.getCurrentTime()) - time) < .02);
  await diagram.getByRole('button', {name: 'Replay animation'}).click();
  assert.equal(await diagram.getAttribute('data-step'), '0');
  await page.screenshot({path: '/test/guide-modes.png', fullPage: true});
  await diagram.getByRole('button', {name: 'Next step'}).click();
  await diagram.getByRole('button', {name: 'Next step'}).click();
  assert.equal(await diagram.locator('.gd-vxlan').evaluate(el => getComputedStyle(el).opacity), '1');
  await page.screenshot({path: '/test/guide-vxlan.png', fullPage: true});
  await diagram.getByRole('button', {name: 'Play animation', exact: true}).click();
  await page.getByRole('button', {name: 'Original PNG animation', exact: true}).click();
  assert.equal(await svg.evaluate(el => el.animationsPaused()), true);
  assert.ok(await page.locator('#mode-photo img').isVisible());
  assert.equal(await page.locator('#mode-photo img').getAttribute('src'), '/images/dpu-board-reference-2.png');
  await page.getByRole('button', {name: 'Play packet', exact: true}).click();
  await page.getByRole('button', {name: 'Animated comparison', exact: true}).click();
  assert.equal(await page.locator('#packet-track').getAttribute('data-playing'), 'false');
  await page.goto('http://127.0.0.1:8780/#software');
  const software = page.locator('[data-guide-diagram="software"]');
  for (const expected of ['1 / 4', '2 / 4', '3 / 4', '4 / 4']) {
    assert.match(await software.locator('[data-guide-step]').innerText(), new RegExp(expected));
    if (expected !== '4 / 4') await software.getByRole('button', {name: 'Next step'}).click();
  }
  assert.match(await software.locator('[data-guide-caption]').innerText(), /containers/);
  await page.screenshot({path: '/test/guide-software.png', fullPage: true});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.reload();
  assert.equal(await software.locator('svg').evaluate(el => el.animationsPaused()), true);
  await software.getByRole('button', {name: 'Next step'}).click();
  assert.equal(await software.getAttribute('data-step'), '1');
  for (const width of [820, 390]) {
    await page.setViewportSize({width, height: 900});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const region = software.getByRole('region');
    await region.focus();
    await page.keyboard.press('ArrowRight');
    if (width === 390) {
      await page.waitForTimeout(200);
      assert.ok(await region.evaluate(el => el.scrollLeft > 0));
    }
    await page.screenshot({path: `/test/guide-software-${width}.png`, fullPage: true});
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(writes, []);
  console.log('PASS: SVG playback, precise pause, stepping/replay, original PNG, view switching, reduced motion, mobile scrolling; no mutations.');
} finally {await browser.close();}
