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
  };
}
