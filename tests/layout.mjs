// Read-only browser regression: no exercise reset or learner-file writes.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch();
try {
  for (const [width, height] of [[1440, 900], [1280, 720], [1100, 500], [900, 700], [820, 650], [600, 600]]) {
    const page = await browser.newPage({viewport: {width, height}});
    await page.goto('http://127.0.0.1:8780/kubernetes');
    await page.waitForFunction(() => document.querySelector('#connection').textContent.includes('Connected'));
    for (const scroll of [false, true]) {
      if (scroll) await page.locator('.lesson').evaluate(el => { el.scrollTop = el.scrollHeight; });
      const layout = await page.evaluate(() => {
        const bounds = selector => {
          const {top, left, right, bottom, height} = document.querySelector(selector).getBoundingClientRect();
          return {top, left, right, bottom, height};
        };
        return {lesson: bounds('.lesson'), pane: bounds('.terminal-pane'), terminal: bounds('#terminal'), width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight};
      });
      const label = `${width}x${height}, scrolled=${scroll}`;
      assert.ok(layout.height <= height + 1 && layout.width <= width + 1, `${label}: page must fit viewport`);
      assert.ok(layout.terminal.top >= 0 && layout.terminal.bottom <= height, `${label}: terminal must stay visible`);
      assert.ok(layout.terminal.height >= 150, `${label}: terminal must have usable editing space`);
      assert.ok(layout.lesson.right <= layout.pane.left + 1 || layout.lesson.bottom <= layout.pane.top + 1, `${label}: console must not cover lesson`);
    }
    await page.screenshot({path: `/test/layout-${width}.png`});
    await page.close();
  }
  console.log('PASS: terminal and lesson remain visible at six viewport sizes before and after scrolling.');
} finally { await browser.close(); }
