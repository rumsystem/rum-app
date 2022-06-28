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
      TEST_ENV: process.env.TEST_ENV!,
      devtool: 'true',
    },
    args: ['.'],
    headless: false,
  });
  const pages = await app.pages();
  const [page] = pages;
  await page.setViewport({ width: 1260, height: 740 });

  await sleep(5000);

  await Promise.any([
    expect(page).toMatchElement('.sidebar', {
      timeout: 10000,
    }),
    expect(page).toMatchElement('[data-test-id="welcome-page"]', {
      timeout: 10000,
    }),
  ]).catch((e) => {
    console.log('failed to load app');
    throw e;
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
