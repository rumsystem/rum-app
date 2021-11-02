export function createUserStore() {
  return {
    isFetched: false,
    isLogin: false,
    user: {} as any,
    setUser(user: any) {
      this.user = user;
      this.isLogin = true;
    },
  };
}
