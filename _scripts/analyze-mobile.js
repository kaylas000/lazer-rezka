const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();

  // Mobile analysis
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:4000/dxf-generator/');
  await page.waitForTimeout(1500);

  console.log('=== MOBILE 375x812 (iPhone) ===');
  const info = await page.evaluate(() => {
    const svg = document.querySelector('.dxf-preview-svg svg');
    const svgRect = svg ? svg.getBoundingClientRect() : null;
    return {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pageOverflows: document.documentElement.scrollWidth > window.innerWidth,
      pageHeight: document.documentElement.scrollHeight,
      layout: document.querySelector('.dxf-layout')?.getBoundingClientRect(),
      form: document.querySelector('.dxf-form-panel')?.getBoundingClientRect(),
      result: document.querySelector('.dxf-result-panel')?.getBoundingClientRect(),
      svgViewBox: svg?.getAttribute('viewBox'),
      svgRect: svgRect ? { w: Math.round(svgRect.width), h: Math.round(svgRect.height) } : null,
      tabs: document.querySelector('.dxf-tabs')?.getBoundingClientRect(),
    };
  });

  // Clean up rect objects for JSON
  const clean = (r) => r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null;
  info.layout = clean(info.layout);
  info.form = clean(info.form);
  info.result = clean(info.result);
  info.tabs = clean(info.tabs);

  console.log(JSON.stringify(info, null, 2));

  // Check if any element overflows
  const overflowEls = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const overflowing = [];
    all.forEach(el => {
      if (el.scrollWidth > el.clientWidth) {
        overflowing.push({
          tag: el.tagName,
          class: el.className?.substring(0, 50),
          scrollW: el.scrollWidth,
          clientW: el.clientWidth
        });
      }
    });
    return overflowing.slice(0, 5);
  });
  console.log('Overflowing elements:', overflowEls.length > 0 ? JSON.stringify(overflowEls, null, 2) : 'none');

  await page.screenshot({ path: '_analysis/mobile-now.png' });
  console.log('Mobile screenshot saved');

  // Desktop
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:4000/dxf-generator/');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '_analysis/desktop-now.png' });
  console.log('Desktop screenshot saved');

  await browser.close();
})();
