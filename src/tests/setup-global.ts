import moduleAlias from 'module-alias';
import path from 'path';
import expect, { setDefaultOptions, ExpectToClickOptions, ExpectTimingActions } from 'expect-puppeteer';
import { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page';

const resolve = (p: string) => path.join(__dirname, '..', p);

moduleAlias.addAlias('utils', resolve('utils'));
moduleAlias.addAlias('tests', resolve('tests'));
moduleAlias.addAlias('store', resolve('store'));
moduleAlias.addAlias('puppeteer', 'puppeteer-core');

(Page.prototype as any).matchByTestId = async function clickByTestId(testId: string, options?: ExpectToClickOptions) {
  const element = await expect(this).toMatchElement(`[data-test-id="${testId}"]`, options);
  return element;
};

(Page.prototype as any).clickByTestId = async function clickByTestId(testId: string, options?: ExpectToClickOptions) {
  const element = await expect(this).toMatchElement(`[data-test-id="${testId}"]`, options);
  await element.click();
};

(Page.prototype as any).fillByTestId = async function clickByTestId(rawSelector: string, content: string, options?: ExpectTimingActions) {
  const [testId, subSelector] = rawSelector.split(' ');
  const selector = [
    `[data-test-id="${testId}"]`,
    subSelector ? ` ${subSelector}` : '',
  ].join('');
  await expect(this).toFill(selector, content, options);
};

setDefaultOptions({ timeout: 5000 });
