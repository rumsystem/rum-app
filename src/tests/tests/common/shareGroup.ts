import { Page } from 'puppeteer';
import sleep from 'utils/sleep';

export const shareGroup = async (page: Page) => {
  await page.clickByTestId('header-share-group');
  const shareGroup = await page.matchByTestId('share-group-modal');
  await sleep(1000);
  const textarea = await shareGroup.matchByTestId('share-group-textarea');
  const content = await textarea.evaluate((e) => (e as HTMLTextAreaElement).value);
  JSON.parse(content);
  await shareGroup.clickByTestId('dialog-close-button');
  await sleep(1000);
};
