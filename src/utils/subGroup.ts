const SUB_GROUP_NAME_PREFIX = 'sub_group_';

export default {
  generateName(topGroupId: string, resource: string) {
    return `${SUB_GROUP_NAME_PREFIX}${topGroupId}_${resource}`;
  },

  isSubGroupName(name: string) {
    return /sub_group_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/.test(name);
  },
};
