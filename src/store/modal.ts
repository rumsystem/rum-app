export function createModalStore() {
  return {
    login: {
      open: true,
      show() {
        this.open = true;
      },
      hide() {
        this.open = false;
      },
    },
  };
}
