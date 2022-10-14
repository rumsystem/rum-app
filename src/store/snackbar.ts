import sleep from 'utils/sleep';

interface ShowOptions {
  message?: string
  delayDuration?: number
  duration?: number
  type?: 'error'
  meta?: any
}

export function createSnackbarStore() {
  return {
    open: false,
    message: '',
    type: 'default',
    meta: {},
    show(options?: ShowOptions) {
      (async () => {
        await sleep(options?.delayDuration ?? 150);
        this.close();
        const { message, duration = 1500, type, meta = {} } = options ?? {};
        this.message = message ?? '';
        this.type = type || 'default';
        const autoHideDuration = type === 'error' && duration === 1500 ? 2000 : duration;
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
