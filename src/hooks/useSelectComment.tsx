import React from 'react';
import { useStore } from 'store';
import sleep from 'utils/sleep';

interface IOptions {
  disabledHighlight?: boolean
  duration?: number
  scrollBlock?: 'center' | 'start' | 'end'
  inObjectDetailModal?: boolean
}

export default () => {
  const { commentStore } = useStore();

  return React.useCallback(
    (selectedCommentId: string, options: IOptions = {}) => {
      (async () => {
        const domElementId = `comment_${
          options.inObjectDetailModal ? 'in_object_detail_modal' : ''
        }_${selectedCommentId}`;
        const comment = document.querySelector(`#${domElementId}`);
        if (!comment) {
          console.error('selected comment not found');
          return;
        }
        comment.scrollIntoView({
          block: options.scrollBlock || 'center',
          behavior: 'smooth',
        });
        if (options.disabledHighlight) {
          return;
        }
        commentStore.setHighlightDomElementId(domElementId);
        await sleep(options.duration || 1500);
        commentStore.setHighlightDomElementId('');
      })();
    },
    [commentStore],
  );
};
