import 'puppeteer';
import { ExpectToClickOptions, ExpectTimingActions } from 'expect-puppeteer';

declare module 'puppeteer' {
  interface CustomTestMethods {
    matchByTestId: (testId: string, options?: ExpectToClickOptions) => Promise<ElementHandle>
    notMatchByTestId: (testId: string, options?: ExpectToClickOptions) => Promise<void>
    clickByTestId: (testId: string, options?: ExpectToClickOptions) => Promise<ElementHandle>
    /**
     * @param {string} [testId] - `"testId"` or `"testId subselector"`
     */
    fillByTestId: (testId: string, content: string, options?: ExpectTimingActions) => Promise<void>
  }
  interface Page extends CustomTestMethods {}
  interface ElementHandle extends CustomTestMethods {}
}
