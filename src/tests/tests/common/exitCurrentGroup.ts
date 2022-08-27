import { Page } from 'puppeteer';

export const exitCurrentGroup = async (page: Page) => {
  await page.clickByTestId('group-menu-button');
  await page.clickByTestId('group-menu-exit-group-button');
  await page.clickByTestId('exit-group-dialog-confirm-button');
};
