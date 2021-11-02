export function createModalStore() {
  return {
    login: {
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
