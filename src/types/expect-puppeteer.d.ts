declare module 'expect-puppeteer' {
  import { ElementHandle, Page, Dialog } from 'puppeteer';

  /**
   * Interval at which pageFunctions may be executed.
   */
  export type ExpectPolling = number | 'mutation' | 'raf';

  /**
   * Default options that apply to all expectations and can be set globally
   */
  export interface ExpectDefaultOptions {
    /**
       * An interval at which the pageFunction is executed. Defaults to "raf".
       */
    polling?: ExpectPolling | undefined

    /**
       * Maximum time to wait for in milliseconds. Defaults to 500.
       */
    timeout?: number | undefined
  }

  /**
   * Configures how to poll for an element.
   */
  export interface ExpectTimingActions extends ExpectDefaultOptions {
    /**
       * delay to pass to the puppeteer element.type API
       */
    delay?: number | undefined
  }

  export interface ExpectToClickOptions extends ExpectTimingActions {
    /**
       * Defaults to left.
       */
    button?: 'left' | 'right' | 'middle' | undefined

    /**
       * defaults to 1. See UIEvent.detail.
       */
    clickCount?: number | undefined

    /**
       * Time to wait between mousedown and mouseup in milliseconds. Defaults to 0.
       */
    delay?: number | undefined

    /**
       * A text or a RegExp to match in element textContent.
       */
    text?: string | RegExp | undefined

    /**
       * wait for element to be present in DOM and to be visible, i.e. to not have display: none or visibility: hidden CSS properties. Defaults to false.
       */
    visible?: boolean | undefined
  }

  export interface ExpectPuppeteer {
    // These must all match the ExpectPuppeteer interface above.
    // We can't extend from it directly because some method names conflict in type-incompatible ways.
    toClick: (selector: string, options?: ExpectToClickOptions) => Promise<void>
    toDisplayDialog: (block: () => Promise<void>) => Promise<Dialog>
    toFill: (selector: string, value: string, options?: ExpectTimingActions) => Promise<void>
    toFillForm: (selector: string, values: Record<string, string>, options?: ExpectTimingActions) => Promise<void>
    toMatch: (selector: string, options?: ExpectTimingActions) => Promise<void>
    toMatchElement: (selector: string, options?: ExpectToClickOptions) => Promise<ElementHandle>
    toSelect: (selector: string, valueOrText: string, options?: ExpectTimingActions) => Promise<void>
    toUploadFile: (selector: string, filePath: string, options?: ExpectTimingActions) => Promise<void>

    not: {
      toMatch: (selector: string, options?: ExpectTimingActions) => Promise<void>
      toMatchElement: (selector: string, options?: ExpectToClickOptions) => Promise<void>
    }
  }

  const expectPuppeteer: (instance: ElementHandle | Page) => ExpectPuppeteer;

  export const setDefaultOptions: (options: ExpectDefaultOptions) => void;
  export const getDefaultOptions: () => ExpectDefaultOptions;

  export default expectPuppeteer;
}
