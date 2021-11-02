interface IProps {
  title?: string;
  amount?: string;
  currency: string;
  getPaymentUrl: any;
  checkResult: any;
  done: any;
}

export function createModalStore() {
  return {
    auth: {
      open: false,
      show() {
        this.open = true;
      },
      hide() {
        this.open = false;
      },
    },
    verification: {
      open: false,
      pass: (() => {}) as any,
      show(props: any) {
        this.open = true;
        this.pass = props.pass;
      },
      hide() {
        this.open = false;
      },
    },
    payment: {
      open: false,
      props: {} as IProps,
      show(props: IProps) {
        this.open = true;
        this.props = props;
      },
      hide() {
        this.open = false;
      },
    },
  };
}
