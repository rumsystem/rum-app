import { sleep } from 'utils';

export function createSnackbarStore() {
  return {
    open: false,
    message: '',
    type: 'default',
    meta: {},
    show(options: any = {}) {
      (async () => {
        await sleep(options.delayDuration ? options.delayDuration : 150);
        this.close();
        const { message, duration = 1500, type, meta = {} } = options;
        this.message = message;
        this.type = type || 'default';
        const autoHideDuration = duration;
        this.open = true;
        this.meta = meta;
        await sleep(autoHideDuration);
        this.close();
      })();
    },
    close() {
      this.open = false;
    },
  };
}
