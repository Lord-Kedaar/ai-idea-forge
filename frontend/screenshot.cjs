const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  // Desktop
  const desktopCtx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const dPage = await desktopCtx.newPage();
  await dPage.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await dPage.waitForTimeout(1500);
  await dPage.screenshot({ path: '/tmp/screenshot_desktop.png', fullPage: true });
  console.log('desktop OK');

  // iPhone 15 viewport
  const mobileCtx = await browser.newContext({
    viewport: { width: 393, height: 852 },  // iPhone 15
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mPage = await mobileCtx.newPage();
  await mPage.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await mPage.waitForTimeout(1500);
  await mPage.screenshot({ path: '/tmp/screenshot_iphone.png', fullPage: true });
  console.log('iphone OK');

  await browser.close();
})();
