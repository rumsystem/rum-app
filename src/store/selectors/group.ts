import { IGroup, GROUP_TEMPLATE_TYPE } from 'apis/group';

export const isPublicGroup = (group: IGroup) => group.encryption_type.toLowerCase() === 'public';

export const isPrivateGroup = (group: IGroup) => group.encryption_type.toLowerCase() === 'private';

export const isTimelineGroup = (group: IGroup) => group.app_key === GROUP_TEMPLATE_TYPE.TIMELINE;

export const isPostGroup = (group: IGroup) => group.app_key === GROUP_TEMPLATE_TYPE.POST;

export const isNoteGroup = (group: IGroup) => group.app_key === GROUP_TEMPLATE_TYPE.NOTE;

export const isGroupOwner = (group: IGroup) => group.owner_pubkey === group.user_pubkey;

export const getRole = (group: IGroup) => (isGroupOwner(group) ? 'owner' : 'user');
