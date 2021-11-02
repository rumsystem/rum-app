export function createProfileStore() {
  return {
    name: '',

    avatar: '',

    setName(name: string) {
      this.name = name;
    },

    setAvatar(avatar: string) {
      this.avatar = avatar;
    },
  };
}
