import { Page } from 'puppeteer';
import expectP from 'expect-puppeteer';
import expect from 'expect';
import { format } from 'date-fns';
import { setup } from 'tests/setup';
import sleep from 'utils/sleep';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import {
  createGroup,
  exitCurrentGroup,
  myGroupModal,
  groupInfoModal,
  nodeAndNetowrk,
  shareGroup,
} from './common';

export default async () => {
  const { page, destroy } = await setup();
  await createGroup(page, 'testgroup', GROUP_TEMPLATE_TYPE.TIMELINE);
  await page.matchByTestId('timeline-feed');

  await testPostAndComment(page);
  await testProfileChange(page);
  await myGroupModal(page);
  await groupInfoModal(page);
  await nodeAndNetowrk(page);
  await shareGroup(page);

  await exitCurrentGroup(page);

  await expectP(page).not.toMatchElement('.sidebar', {
    timeout: 10000,
  });

  await sleep(1000);
  await destroy();
};

const testPostAndComment = async (page: Page) => {
  const content = [
    format(new Date(), 'yyyy-MM-dd hh-mm:ss'),
    'timeline-test-post',
  ].join('');
  await page.clickByTestId('timeline-open-editor-button');
  await page.fillByTestId('timeline-new-post-input textarea', content);
  await page.clickByTestId('editor-submit-button');
  await sleep(5000);

  await expectP(page).toMatchElement('.timeline-object-item [data-test-id="synced-timeline-item-menu"]', {
    timeout: 30000,
  });

  await page.clickByTestId('timeline-object-comment-button');
  const commentSection = await page.matchByTestId('timeline-comment-item');
  // commentSection
  const commentContent = [
    format(new Date(), 'yyyy-MM-dd hh-mm:ss'),
    'timeline-test-comment',
  ].join('');
  await commentSection.clickByTestId('editor-click-to-show-post-button');
  await commentSection.fillByTestId('timeline-comment-editor textarea', commentContent);
  await commentSection.clickByTestId('editor-submit-button');

  await commentSection.matchByTestId('synced-timeline-item-menu', {
    timeout: 30000,
  });
};

const testProfileChange = async (page: Page) => {
  const username = `profile-page-user-name-${Date.now()}`;
  await page.clickByTestId('header-avatar');
  await sleep(1000);
  await page.clickByTestId('profile-edit-button');
  await sleep(1000);
  await page.fillByTestId('profile-name-input input', username);
  await sleep(1000);
  await page.clickByTestId('profile-edit-confirm');
  await sleep(500);
  await page.matchByTestId('profile-wait-for-sync-tip');
  await page.notMatchByTestId('profile-wait-for-sync-tip', {
    timeout: 30000,
  });
  await sleep(1000);
  const usernameElement = await page.matchByTestId('profile-page-user-name');
  const actualUsername = await usernameElement.evaluate((el) => el.textContent);

  expect(actualUsername).toBe(username);
  await page.clickByTestId('content-sidebar-menu-back');
};
