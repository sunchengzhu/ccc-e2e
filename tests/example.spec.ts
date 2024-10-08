import { test, expect } from './fixtures';
import moment = require('moment-timezone');

test('Message to sign and verify', async ({context}) => {
  const page = await context.newPage();
  await page.goto("https://app.ckbccc.com/");

  const getFormattedTime = () => {
    return moment().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss.SSS');
  };

  let pageLoadCount = 0; // 从0开始计数
  const waitForPageClose = new Promise<void>((resolve) => {
    context.on('page', async (extensionNewPage) => {
      pageLoadCount += 1; // 每次新页面加载时递增计数
      console.log(`Extension New Page ${pageLoadCount} opened at: ${getFormattedTime()}`);
      await extensionNewPage.waitForLoadState(); // 等待新页面加载完毕
      if (extensionNewPage.url().includes('notification.html')) {
        if (pageLoadCount === 1) { // 计数器为 1 时执行
          await extensionNewPage.click('[data-testid="choose-account-list-0"]');
          await extensionNewPage.click('[data-testid="choose-account-list-1"]');
          await extensionNewPage.click('[data-testid="page-container-footer-next"]');
          await extensionNewPage.click('[data-testid="page-container-footer-next"]');
        } else {
          await extensionNewPage.waitForLoadState('networkidle');
          await extensionNewPage.click('[data-testid="confirm-footer-button"]');
        }
        await extensionNewPage.waitForEvent('close');
        console.log(`Extension New Page ${pageLoadCount} closed at: ${getFormattedTime()}`);
        // 页面关闭后，解析 Promise，表示事件已完成
        resolve();
      }
    });
  });

  await page.getByRole('button', {name: 'Wallet'}).click();
  await page.getByRole('button', {name: 'MetaMask'}).click();

  // 等待 `extensionNewPage` 关闭后，再执行接下来的操作
  await waitForPageClose;

  await page.getByRole('button', {name: 'Sign'}).click();
  await page.fill('input[placeholder="Message to sign and verify"]', '666');

  // 使用 locator 定位并点击第二个 "Sign" 按钮
  const signButtons = page.locator('text="Sign"');
  await signButtons.nth(1).click(); // 'nth(1)' 代表第二个元素，索引从 0 开始

  // 定位 "1 Sign" 文本的元素，然后选择其父级元素的下一个同级元素中的 <p> 标签
  const Signature = await page.locator('text="1 Sign"').locator('xpath=../following-sibling::div/p').textContent();
  console.log(Signature);
  const jsonString = Signature.replace('Signature: ', '').trim();
  const signatureJson = JSON.parse(jsonString);
  expect(signatureJson.identity).toEqual('0x6fac4d18c912343bf86fa7049364dd4e424ab9c0');
  expect(signatureJson.signType).toEqual('EvmPersonal');
  expect(signatureJson.signature).toEqual('0xdd7bc4b325c6cb90e97ac72e3ae226e7c6c3143a78b2c2ebf8ed8284f230929d44321158bde470ee86af44773238f29f4c608f6eb6ee8ddd45f3e8d9a63c4aa91b');

  const verifyButtons = page.locator('text="Verify"');
  await verifyButtons.nth(1).click();

  const verifyResult = await page.locator('text="2 Sign"').locator('xpath=../following-sibling::div/p').textContent();
  console.log(verifyResult);
  expect(verifyResult).toEqual('Valid');

  // await new Promise(resolve => setTimeout(resolve, 10000));
});
