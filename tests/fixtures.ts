import { test as baseTest, chromium, expect } from '@playwright/test';
import * as path from "path";
import * as fs from "fs";
import AdmZip from 'adm-zip';


// 全局配置路径
const extensionPath = path.join(__dirname, '../extensions/metamask-chrome-12.1.3');

// 解压 ZIP 文件
async function extractZip() {
  const zipPath = path.join(__dirname, '../extensions/metamask-chrome-12.1.3.zip');
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extensionPath, true);
  console.log('Extraction complete.');
}

// 删除目录
async function deleteDirectory() {
  return new Promise<void>((resolve, reject) => {
    fs.rm(extensionPath, {recursive: true, force: true}, (error) => {
      if (error) {
        console.error('Error removing directory:', error);
        reject(error);
      } else {
        console.log('Directory removed.');
        resolve();
      }
    });
  });
}

// 创建基础测试配置，并包含全局钩子
const test = baseTest.extend({
  context: async ({}, use) => {
    await extractZip(); // 这里是测试开始前执行的操作

    const videoDir = 'videos/';
    // 清理视频目录
    if (fs.existsSync(videoDir)) {
      fs.rmSync(videoDir, { recursive: true, force: true }); // 递归删除目录
    }

    const context = await chromium.launchPersistentContext('', {
      // headless:false,
      args: [
        `--headless=new`,
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
      // // 添加录屏设置
      // recordVideo: {
      //   dir: videoDir // 视频将被保存在这个目录
      // }
    });

    await use(context);

    await context.close();

    await deleteDirectory(); // 这里是测试结束后执行的操作
  },
  extensionId: async ({context}, use) => {
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent('serviceworker');
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

test.beforeEach(async ({context, extensionId}) => {
  // 等待插件页面加载出来
  const extensionPage = await context.waitForEvent('page', page => page.url().includes(extensionId));
  console.log('Extension page found, starting accounts import process.');

  // 关闭所有非扩展页面
  const pages = await context.pages();
  for (const p of pages) {
    if (p !== extensionPage) {
      await p.close();
    }
  }

  // 切换到插件页面
  await extensionPage.bringToFront();
  await extensionPage.click('input[data-testid="onboarding-terms-checkbox"]');
  // await extensionPage.getByRole('button', {name: '导入现有钱包'}).click();
  await extensionPage.click('[data-testid="onboarding-import-wallet"]');

  await extensionPage.click('[data-testid="metametrics-i-agree"]');

  const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const words = mnemonic.split(' ');
  for (let i = 0; i < words.length; i++) {
    const inputSelector = `[data-testid="import-srp__srp-word-${i}"]`;
    await extensionPage.fill(inputSelector, words[i]);
  }
  await extensionPage.click('[data-testid="import-srp-confirm"]');

  await extensionPage.fill('[data-testid="create-password-new"]', '12345678');
  await extensionPage.fill('[data-testid="create-password-confirm"]', '12345678');
  await extensionPage.click('[data-testid="create-password-terms"]');
  await extensionPage.click('[data-testid="create-password-import"]');

  await extensionPage.click('[data-testid="onboarding-complete-done"]');

  await extensionPage.click('[data-testid="pin-extension-next"]');

  await extensionPage.click('[data-testid="pin-extension-done"]');
  console.log('Accounts import process completed.');
});

export { test, expect };
