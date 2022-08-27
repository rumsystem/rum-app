import { lang } from 'utils/lang';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';

/** 群组模板类型(用于[group.app_key]) */
export enum GROUP_TEMPLATE_TYPE {
  TIMELINE = 'group_timeline',
  POST = 'group_post',
  NOTE = 'group_note',
}

export const GROUP_TEMPLATE_TYPE_NAME = {
  [GROUP_TEMPLATE_TYPE.TIMELINE]: lang.sns,
  [GROUP_TEMPLATE_TYPE.POST]: lang.forum,
  [GROUP_TEMPLATE_TYPE.NOTE]: lang.note,
};

export const GROUP_TEMPLATE_TYPE_ICON = {
  [GROUP_TEMPLATE_TYPE.TIMELINE]: TimelineIcon,
  [GROUP_TEMPLATE_TYPE.POST]: PostIcon,
  [GROUP_TEMPLATE_TYPE.NOTE]: NotebookIcon,
};

export interface IBootstrap {
  host: string
  id: string
}

export const BOOTSTRAPS = [
  {
    host: '94.23.17.189',
    id: '16Uiu2HAmGTcDnhj3KVQUwVx8SGLyKBXQwfAxNayJdEwfsnUYKK4u',
  },
  {
    host: '132.145.109.63',
    id: '16Uiu2HAmTovb8kAJiYK8saskzz7cRQhb45NRK5AsbtdmYsLfD3RM',
  },
] as IBootstrap[];
