import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';

import { GROUP_TEMPLATE_TYPE } from './constant';

const groupIconMap = new Map<string, React.FunctionComponent<React.SVGProps<SVGSVGElement>>>([
  [GROUP_TEMPLATE_TYPE.TIMELINE, TimelineIcon],
  [GROUP_TEMPLATE_TYPE.POST, PostIcon],
  [GROUP_TEMPLATE_TYPE.NOTE, NotebookIcon],
]);

export const getGroupIcon = (appKey: string) => {
  const GroupTypeIcon = groupIconMap.get(appKey) ?? TimelineIcon;
  return GroupTypeIcon;
};
