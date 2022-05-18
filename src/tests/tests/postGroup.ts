import expectP from 'expect-puppeteer';
import { format } from 'date-fns';
import sleep from 'utils/sleep';
import { setup } from 'tests/setup';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { createGroup, exitCurrentGroup } from './common';

export default async () => {
  const { page, destroy } = await setup();
  await createGroup(page, 'testgroup', GROUP_TEMPLATE_TYPE.POST);
  await page.matchByTestId('post-feed');

  const content = [
    format(new Date(), 'yyyy-MM-dd hh-mm:ss'),
    'forum-test-post',
  ].join('');
  await page.clickByTestId('forum-create-first-post-button');
  await page.fillByTestId('forum-post-title-input input', 'post title');

  await expectP(page).toClick('.CodeMirror-line');
  page.keyboard.type(content);
  await sleep(5000);

  await page.clickByTestId('forum-post-submit-button');
  await sleep(5000);

  await expectP(page).toMatchElement('[data-test-id="forum-object-item"] [data-test-id="synced-timeline-item-menu"]', {
    timeout: 30000,
  });

  await exitCurrentGroup(page);

  await expectP(page).not.toMatchElement('.sidebar', {
    timeout: 10000,
  });

  await sleep(1000);
  await destroy();
};
