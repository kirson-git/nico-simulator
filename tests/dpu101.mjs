// Read-only browser checks: navigation, mode state, quiz grading and layout.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
  const errors = [];
  const writes = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
  await page.goto('http://127.0.0.1:8780');
  await page.locator('#chapter h2').waitFor();
  assert.equal(await page.locator('#previous').isDisabled(), true);
  await page.locator('#next').click();
  for (const view of ['Your board diagram', 'Host + DPU paths']) {
    await page.getByRole('button', {name: view, exact: true}).click();
    const panel = page.locator('[data-board-panel]:not([hidden])');
    assert.equal(await panel.count(), 1);
    await panel.locator('img').evaluate(img => img.decode());
    assert.ok(await panel.locator('img').evaluate(img => img.naturalWidth > 1000));
  }
  await page.getByRole('button', {name: 'Your board diagram', exact: true}).click();
  await page.getByText('Explore the components', {exact: true}).click();
  await page.getByRole('button', {name: 'Arm CPUs', exact: true}).click();
  assert.match(await page.locator('#component-detail').innerText(), /Linux/);
  await page.getByRole('button', {name: 'Memory & storage', exact: true}).click();
  assert.match(await page.locator('#component-detail').innerText(), /RAM|memory/);
  await page.locator('#next').click();
  await page.getByRole('button', {name: 'Original PNG animation', exact: true}).click();
  await page.getByRole('button', {name: 'NIC mode', exact: true}).click();
  assert.match(await page.locator('#mode-detail').innerText(), /inactive/);
  assert.match(await page.locator('#mode-owner').innerText(), /Host/);
  assert.equal(await page.getByRole('button', {name: 'NIC mode', exact: true}).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', {name: 'DPU mode', exact: true}).click();
  assert.match(await page.locator('#mode-owner').innerText(), /DPU/);
  assert.match(await page.locator('#mode-detail').innerText(), /Linux/);
  const hbn = page.getByRole('checkbox', {name: 'Show configured HBN example'});
  await hbn.check();
  assert.match(await page.locator('#packet-result').innerText(), /VNI 10100/);
  await page.getByRole('button', {name: 'NIC mode', exact: true}).click();
  assert.equal(await hbn.isDisabled(), true);
  assert.doesNotMatch(await page.locator('#packet-result').innerText(), /VNI 10100/);
  assert.equal(await page.locator('#mode-arm').getAttribute('data-active'), 'false');
  await page.getByRole('button', {name: 'DPU mode', exact: true}).click();
  assert.equal(await hbn.isChecked(), true, 'DPU mode restores the configured VXLAN example');
  assert.equal(await page.locator('#mode-arm').getAttribute('data-active'), 'true');
  await page.locator('#next').click();
  await page.waitForFunction(() => document.querySelector('#next').disabled);
  assert.equal(await page.locator('#next').isDisabled(), true);
  await page.getByText('Quick check (optional)', {exact: true}).click();
  await page.getByRole('button', {name: 'Check answers'}).click();
  assert.match(await page.locator('#quiz-result').innerText(), /0 of 2/);
  await page.locator('input[name="q0"][value="arm"]').check();
  await page.locator('input[name="q1"][value="nic"]').check();
  await page.getByRole('button', {name: 'Check answers'}).click();
  assert.match(await page.locator('#quiz-result').innerText(), /2 of 2/);
  await page.getByRole('button', {name: 'Try again'}).click();
  assert.equal(await page.locator('input:checked').count(), 0);
  // Every section must remain usable on a Mac window and a narrow phone screen.
  for (const viewport of [{width: 1440, height: 1000}, {width: 820, height: 650}, {width: 390, height: 844}]) {
    await page.setViewportSize(viewport);
    // Wait for the responsive menu's media-query handler before opening it.
    await page.waitForFunction(width => document.querySelector('#course-menu').open === (width > 760), viewport.width);
    for (let chapter = 0; chapter < 4; chapter++) {
      if (!await page.locator('#course-menu').evaluate(el => el.open)) await page.locator('#course-menu > summary').click();
      await page.locator('#chapters a').nth(chapter).click();
      await page.waitForFunction(index => document.querySelector('#counter').textContent.includes(`0${index + 1} ·`), chapter);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal clipping');
      for (const box of await page.locator('#chapter .diagram, #chapter .board, #chapter .machine').all()) {
        assert.ok(await box.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Diagram content fits its box');
      }
      if (chapter === 2) {
        await page.getByRole('button', {name: 'Original PNG animation', exact: true}).click();
        await page.getByRole('checkbox', {name: 'Show configured HBN example'}).check();
      }
      if (viewport.width === 1440) await page.screenshot({path: `/test/dpu101-section-${chapter + 1}.png`, fullPage: true});
    }
    if (viewport.width === 390) {
      if (!await page.locator('#course-menu').evaluate(el => el.open)) await page.locator('#course-menu > summary').click();
      await page.locator('#chapters a').first().click();
      await page.screenshot({path: '/test/dpu101-mobile.png', fullPage: true});
    }
  }
  assert.deepEqual(writes, [], 'Concept interactions make no mutations');
  if (!await page.locator('#course-menu').evaluate(el => el.open)) await page.locator('#course-menu > summary').click();
  await page.locator('[data-course-nav] a[href="/kubernetes"]').click();
  await page.waitForFunction(() => document.querySelector('#connection')?.textContent.includes('Connected'));
  assert.deepEqual(errors, []);
  console.log('PASS: chapter navigation, component and mode state, optional quiz grading/reset, responsive diagrams, read-only concepts and next-lab navigation.');
} finally { await browser.close(); }
