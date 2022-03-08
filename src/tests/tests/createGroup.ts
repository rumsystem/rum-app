import expect from 'expect-puppeteer';
import sleep from 'utils/sleep';
import { setup } from 'tests/setup';

export default async () => {
  const { page, destroy } = await setup();
  const button = await expect(page).toMatchElement('button', {
    text: /新建种子网络/,
  });
  await button.click();

  await expect(page).toFill('.MuiInputBase-input', 'e2e测试种子网络');

  await sleep(100);

  await expect(page).toClick('.right-0 button', {
    text: /新建种子网络/,
  });

  const close = await expect(page).toMatchElement('.MuiPaper-root .absolute.top-0.right-0');
  await sleep(1000);
  // 钱包
  await close.click();
  await sleep(200);
  // profile
  await close.click();

  // 种子网络基本信息
  await sleep(1000);
  const close3 = await expect(page).toMatchElement('.MuiPaper-root .absolute.top-0.right-0');

  await sleep(1000);
  await close3.click();

  await expect(page).toMatchElement('div', {
    text: /发布第一个内容/,
  });

  await sleep(1000);
  await destroy();
};
