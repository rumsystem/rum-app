export default {
  generateName(topGroupId: string, resource: string) {
    return `${topGroupId}_${resource}`;
  },

  isSubGroupName(name: string) {
    return /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/.test(name);
  },
};
