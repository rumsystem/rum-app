export interface IShowOptions {
  content: string
  ok: () => void
  cancel?: any
  cancelText?: string
  cancelDisabled?: boolean
  okText?: string
  contentClassName?: string
  isDangerous?: boolean
}

const DEFAULT_CANCEL_TEXT = '取消';
const DEFAULT_OK_TEXT = '确定';

export function createConfirmDialogStore() {
  return {
    open: false,
    content: '',
    cancelText: '',
    okText: '',
    contentClassName: '',
    loading: false,
    cancelDisabled: false,
    isDangerous: false,
    ok: () => {},
    cancel: null as any,
    show(options: IShowOptions) {
      this.content = options.content;
      this.cancelText = options.cancelText || DEFAULT_CANCEL_TEXT;
      this.cancelDisabled = options.cancelDisabled || false;
      this.okText = options.okText || DEFAULT_OK_TEXT;
      this.contentClassName = options.contentClassName || '';
      this.open = true;
      this.ok = options.ok;
      this.isDangerous = options.isDangerous || false;
      if (options.cancel) {
        this.cancel = options.cancel;
      }
    },
    hide() {
      this.open = false;
      this.loading = false;
      this.cancel = null;
    },
    setLoading(status: boolean) {
      this.loading = status;
    },
  };
}
