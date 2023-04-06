import expect from 'expect-puppeteer';
import { Page } from 'puppeteer';
import sleep from 'utils/sleep';

export const groupInfoModal = async (page: Page) => {
  page.clickByTestId('header-group-name');
  await sleep(1000);
  const close = await expect(page).toMatchElement('.group-info-modal [data-test-id="dialog-close-button"]');
  await sleep(1000);
  await close.click();
  await sleep(1000);
  await expect(page).not.toMatchElement('.group-info-modal');
};
