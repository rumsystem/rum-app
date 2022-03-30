import 'puppeteer';
import { ExpectToClickOptions, ExpectTimingActions } from 'expect-puppeteer';

declare module 'puppeteer' {
  interface Page {
    matchByTestId: (testId: string, options?: ExpectToClickOptions) => Promise<ElementHandle>
    clickByTestId: (testId: string, options?: ExpectToClickOptions) => Promise<void>
    /**
     * @param {string} [testId] - `"testId"` or `"testId subselector"`
     */
    fillByTestId: (testId: string, content: string, options?: ExpectTimingActions) => Promise<void>
  }
}
