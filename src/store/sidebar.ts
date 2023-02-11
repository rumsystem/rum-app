export function createSidebarStore() {
  return {
    collapsed: false,
    collapse() {
      this.collapsed = true;
    },
    restore() {
      this.collapsed = false;
    },
    toggle() {
      this.collapsed = !this.collapsed;
    },
  };
}
