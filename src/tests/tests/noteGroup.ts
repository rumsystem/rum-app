import expect from 'expect-puppeteer';
import sleep from 'utils/sleep';
import { setup } from 'tests/setup';
import { createGroup } from './common/createGroup';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { format } from 'date-fns';
import { exitCurrentGroup } from './common/exitCurrentGroup';

export default async () => {
  const { page, destroy } = await setup();
  await createGroup(page, 'testgroup', GROUP_TEMPLATE_TYPE.NOTE);
  await page.matchByTestId('note-feed');

  const content = [
    format(new Date(), 'yyyy-MM-dd hh-mm:ss'),
    'note-test-post',
  ].join('');
  await page.fillByTestId('note-editor textarea', content);
  await page.clickByTestId('editor-submit-button');
  await sleep(5000);

  await expect(page).toMatchElement('[data-test-id="note-object-item"] [data-test-id="synced-timeline-item-menu"]', {
    timeout: 30000,
  });

  await exitCurrentGroup(page);

  expect(page).not.toMatchElement('.sidebar', {
    timeout: 10000,
  });

  await sleep(1000);
  await destroy();
};
