const { chromium } = require('playwright');
(async () => {
  // Need to find playwright package
  const path = require('path');
  const playwrightPath = path.dirname(require.resolve('playwright/package.json'));

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:4000/dxf-generator/');
  await page.waitForTimeout(1000);

  console.log('=== DESKTOP 1280x900 ===');
  const info = await page.evaluate(() => {
    return {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      bodyWidth: document.body.offsetWidth,
      pageOverflows: document.documentElement.scrollWidth > window.innerWidth,
      layout: document.querySelector('.dxf-layout')?.offsetWidth + 'x' + document.querySelector('.dxf-layout')?.offsetHeight,
      form: document.querySelector('.dxf-form-panel')?.offsetWidth + 'x' + document.querySelector('.dxf-form-panel')?.offsetHeight,
      result: document.querySelector('.dxf-result-panel')?.offsetWidth + 'x' + document.querySelector('.dxf-result-panel')?.offsetHeight,
      svg: document.querySelector('.dxf-preview-svg svg')?.getAttribute('viewBox'),
      svgSize: document.querySelector('.dxf-preview-svg svg')?.offsetWidth + 'x' + document.querySelector('.dxf-preview-svg svg')?.offsetHeight,
      duplicateIds: [...document.querySelectorAll('[id]')].map(e => e.id).filter((id, i, arr) => arr.indexOf(id) !== i),
      consoleErrors: [],
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Check for label issues
  const labels = await page.evaluate(() => {
    return [...document.querySelectorAll('label')].map(l => ({
      text: l.textContent?.trim()?.substring(0, 30),
      hasFor: l.hasAttribute('for'),
      forId: l.getAttribute('for')
    }));
  });
  console.log('Labels without for:', labels.filter(l => !l.hasFor).length);

  // Check form fields without id
  const fields = await page.evaluate(() => {
    return [...document.querySelectorAll('input, select, textarea')].map(f => ({
      name: f.getAttribute('name'),
      type: f.type,
      hasId: f.hasAttribute('id'),
      id: f.getAttribute('id')
    })).filter(f => !f.hasId);
  });
  console.log('Form fields without id:', fields.length);
  if (fields.length > 0) console.log(JSON.stringify(fields.slice(0, 5), null, 2));

  await browser.close();
})();
