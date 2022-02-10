import { lang } from 'utils/lang';

export interface IShowOptions {
  content: string
  ok: () => void
  cancel?: any
  cancelText?: string
  cancelDisabled?: boolean
  okText?: string
  contentClassName?: string
  isDangerous?: boolean
  maxWidth?: number
}

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
    maxWidth: 250,
    ok: () => {},
    cancel: null as any,
    show(options: IShowOptions) {
      this.content = options.content;
      this.cancelText = options.cancelText || lang.cancel;
      this.cancelDisabled = options.cancelDisabled || false;
      this.okText = options.okText || lang.yes;
      this.contentClassName = options.contentClassName || '';
      this.maxWidth = options.maxWidth || 250;
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
