import { Page } from 'puppeteer';
import expect from 'expect-puppeteer';
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
  await page.fillByTestId('create-group-name-input input', groupName);
  await page.clickByTestId('group-create-confirm');

  // 钱包 / profile
  const popupClose = await expect(page).toMatchElement('.MuiPaper-root .absolute.top-0.right-0');
  await sleep(1000); // wait for dialog open
  await popupClose.click();
  await sleep(200);
  await popupClose.click();
  await sleep(1000); // wait for dialog close

  // 种子网络基本信息
  const popupClose2 = await expect(page).toMatchElement('.MuiPaper-root .absolute.top-0.right-0');
  await sleep(1000); // wait for dialog close
  await popupClose2.click();
};
