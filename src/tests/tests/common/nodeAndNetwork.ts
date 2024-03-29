import expect from 'expect-puppeteer';
import { Page } from 'puppeteer-core';
import sleep from 'utils/sleep';

export const nodeAndNetowrk = async (page: Page) => {
  await page.clickByTestId('header-node-and-network');
  await sleep(500);
  await page.clickByTestId('node-and-network-node-params');
  await sleep(500);
  await expect(page).toClick('.node-params-modal [data-test-id="dialog-close-button"]');
  await sleep(500);
  await page.clickByTestId('node-and-network-network-status');
  await sleep(500);
  await expect(page).toClick('.network-info-modal [data-test-id="dialog-close-button"]');
  await sleep(500);
  await expect(page).toClick('.node-info-modal [data-test-id="dialog-close-button"]');
  await sleep(500);
  await expect(page).not.toMatchElement('.node-info-modal');
};
