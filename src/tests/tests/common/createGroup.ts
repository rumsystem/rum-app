import { Page } from 'puppeteer';
import expect from 'expect-puppeteer';
import sleep from 'utils/sleep';
import { GROUP_TEMPLATE_TYPE } from 'apis/group';

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

  if (groupType !== GROUP_TEMPLATE_TYPE.NOTE) {
    // 钱包 / profile
    const popupClose = await expect(page).toMatchElement('.MuiPaper-root .absolute.top-0.right-0');
    await sleep(1000); // wait for dialog open
    await popupClose.click();
    await sleep(200);
    await popupClose.click();
    await sleep(1000); // wait for dialog close
  }
};
