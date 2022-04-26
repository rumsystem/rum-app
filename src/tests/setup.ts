import path from 'path';
import electron from 'electron';
import rimraf from 'rimraf';
import puppeteer from 'puppeteer';
import expect from 'expect-puppeteer';
import sleep from 'utils/sleep';

export const setup = async () => {
  await new Promise<void>((rs) => {
    rimraf(path.join(__dirname, 'userData'), (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      rs();
    });
  });

  const app = await puppeteer.launch({
    executablePath: electron as any,
    env: {
      // NODE_ENV: 'development',
      TEST_ENV: process.env.TEST_ENV!,
      devtool: 'true',
    },
    // dumpio: true,
    args: ['.'],
    headless: false,
  });
  const pages = await app.pages();
  const [page] = pages;
  await page.setViewport({ width: 1260, height: 740 });

  page.evaluate(() => {
    (window as any).IS_E2E_TEST = true;
  });

  await sleep(5000);

  await expect(page).toMatchElement('button', {
    text: /新建种子网络/,
    timeout: 10000,
  });

  return {
    app,
    page,
    destroy: async () => {
      await page.close();
      await app.close();
    },
  } as const;
};
