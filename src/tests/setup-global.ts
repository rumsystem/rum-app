import moduleAlias from 'module-alias';
import path from 'path';
import expect, { setDefaultOptions, ExpectToClickOptions, ExpectTimingActions } from 'expect-puppeteer';
import { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page';
import { ElementHandle } from 'puppeteer-core/lib/cjs/puppeteer/common/JSHandle';

const resolve = (p: string) => path.join(__dirname, '..', p);

moduleAlias.addAlias('utils', resolve('utils'));
moduleAlias.addAlias('tests', resolve('tests'));
moduleAlias.addAlias('store', resolve('store'));
moduleAlias.addAlias('puppeteer', 'puppeteer-core');


async function matchByTestId(this: any, testId: string, options?: ExpectToClickOptions) {
  const element = await expect(this).toMatchElement(`[data-test-id="${testId}"]`, options);
  return element;
}

async function notMatchByTestId(this: any, testId: string, options?: ExpectToClickOptions) {
  await expect(this).not.toMatchElement(`[data-test-id="${testId}"]`, options);
}

async function clickByTestId(this: any, testId: string, options?: ExpectToClickOptions) {
  const element = await expect(this).toMatchElement(`[data-test-id="${testId}"]`, options);
  await element.click();
  return element;
}

async function fillByTestId(this: any, rawSelector: string, content: string, options?: ExpectTimingActions) {
  const [testId, subSelector] = rawSelector.split(' ');
  const selector = [
    `[data-test-id="${testId}"]`,
    subSelector ? ` ${subSelector}` : '',
  ].join('');
  await expect(this).toFill(selector, content, options);
}

(Page.prototype as any).matchByTestId = matchByTestId;
(Page.prototype as any).notMatchByTestId = notMatchByTestId;
(Page.prototype as any).clickByTestId = clickByTestId;
(Page.prototype as any).fillByTestId = fillByTestId;
(ElementHandle.prototype as any).matchByTestId = matchByTestId;
(ElementHandle.prototype as any).notMatchByTestId = notMatchByTestId;
(ElementHandle.prototype as any).clickByTestId = clickByTestId;
(ElementHandle.prototype as any).fillByTestId = fillByTestId;

setDefaultOptions({ timeout: 5000 });
