import { Page } from 'puppeteer';
import sleep from 'utils/sleep';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';

export const createGroup = async (page: Page, groupName: string, groupType: GROUP_TEMPLATE_TYPE) => {
  Promise.any([
    (async () => {
      await page.clickByTestId('sidebar-plus-button');
      await page.clickByTestId('sidebar-menu-item-create-group');
    })(),
    (async () => {
      await page.clickByTestId('welcome-page-create-group-button');
    })(),
  ]).catch((e) => {
    console.log('can\'t find create group button');
    throw e;
  });

  await page.clickByTestId(`group-type-${groupType}`);
  await page.clickByTestId('create-group-modal-next-step');
  await sleep(100);
  if (groupType !== GROUP_TEMPLATE_TYPE.NOTE) {
    await page.clickByTestId('create-group-modal-next-step');
  }
  await page.fillByTestId('create-group-name-input input', groupName);
  await page.clickByTestId('create-group-modal-confirm');
  await page.clickByTestId('create-group-confirm-modal-confirm');
  await sleep(5000);
};
