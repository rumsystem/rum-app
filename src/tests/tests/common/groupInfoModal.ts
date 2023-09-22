import expectPuppeteer from 'expect-puppeteer';
import { Page } from 'puppeteer';
import sleep from 'utils/sleep';

export const groupInfoModal = async (page: Page) => {
  page.clickByTestId('header-group-name');
  await sleep(1000);
  const close = await expectPuppeteer(page).toMatchElement('.group-info-modal [data-test-id="dialog-close-button"]');
  await sleep(1000);
  await close.click();
  await sleep(1000);
  await expectPuppeteer(page).not.toMatchElement('.group-info-modal');
};
