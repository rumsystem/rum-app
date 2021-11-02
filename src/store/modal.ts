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
  };
}
