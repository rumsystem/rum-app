import { Page } from 'puppeteer';
import sleep from 'utils/sleep';

export const myGroupModal = async (page: Page) => {
  await page.clickByTestId('sidebar-my-group-button');
  await sleep(1000);
  await page.matchByTestId('my-group-modal');
  await page.clickByTestId('my-group-modal-close');
  await sleep(1000);
  await page.notMatchByTestId('my-group-modal');
};
