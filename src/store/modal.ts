export function createModalStore() {
  return {
    pageLoading: {
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
