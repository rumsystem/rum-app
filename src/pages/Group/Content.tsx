import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { ago, sleep } from 'utils';
import classNames from 'classnames';
import { FiChevronDown } from 'react-icons/fi';
import { RiErrorWarningFill, RiCheckboxCircleFill } from 'react-icons/ri';
import Loading from 'components/Loading';
import Tooltip from '@material-ui/core/Tooltip';
import { ContentItem } from 'apis/group';
import { useStore } from 'store';

export default observer((props: { content: ContentItem }) => {
  const { groupStore } = useStore();

  const { content } = props;
  const state = useLocalStore(() => ({
    status: '',
    canExpand: false,
    expand: false,
  }));
  const contentRef = React.useRef<any>();

  React.useEffect(() => {
    if (
      contentRef.current &&
      contentRef.current.scrollHeight > contentRef.current.clientHeight
    ) {
      state.canExpand = true;
    } else {
      state.canExpand = false;
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      const isJustAdded = groupStore.justAddedContentTrxId === content.TrxId;
      if (isJustAdded) {
        state.status = 'publishing';
        await sleep(1500);
        if (content.Publisher) {
          state.status = 'published';
          await sleep(1000);
          state.status = '';
        } else {
          state.status = 'failed';
        }
        groupStore.setJustAddedContentTrxId('');
      } else if (!content.Publisher) {
        state.status = 'failed';
      }
    })();
  }, [groupStore.justAddedContentTrxId, content]);

  return (
    <div className="rounded-12 bg-white mt-3 px-8 py-6 w-[600px] box-border relative">
      <div className="flex relative">
        <img
          className="rounded-full border-shadow absolute top-0 left-0"
          src={`https://source.unsplash.com/user/erondu/10${
            String(content.TimeStamp)[8]
          }x10${String(content.TimeStamp)[8]}`}
          alt={content.Publisher}
          width="42"
          height="42"
        />
        <div className="pl-12 ml-2">
          <div className="flex items-center leading-none mt-3-px">
            <Tooltip
              placement="top"
              title={`节点 ID：${content.Publisher}`}
              interactive
              arrow
            >
              <div className="text-gray-88 font-bold">
                {content.Publisher.slice(0, 8) || 'Me'}
              </div>
            </Tooltip>
            <div className="px-2 text-gray-99">·</div>
            <div className="text-12 text-gray-bd">
              {ago(new Date(content.TimeStamp / 1000000).toISOString())}
            </div>
          </div>
          <div
            ref={contentRef}
            className={classNames(
              {
                expand: state.expand,
                fold: !state.expand,
              },
              'mt-2 text-gray-4a break-words whitespace-pre-wrap tracking-wide'
            )}
          >
            {content.Content.content}
          </div>
          {!state.expand && state.canExpand && (
            <div className="relative mt-6-px pb-2">
              <div
                className="text-blue-400 cursor-pointer tracking-wide flex justify-center items-center text-12 absolute w-full top-0 left-0"
                onClick={() => (state.expand = true)}
              >
                展开
                <FiChevronDown className="text-16 ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>
      {state.status === 'publishing' && (
        <Tooltip placement="top" title="正在同步给所有节点" arrow>
          <div className="absolute top-[17px] right-[17px] rounded-full text-12 leading-none font-bold tracking-wide">
            <Loading size={16} />
          </div>
        </Tooltip>
      )}
      {state.status === 'failed' && (
        <Tooltip
          placement="top"
          title="发布失败了，当前网络没有其他节点来同步这条内容，请再加入一个新节点来互相同步"
          arrow
        >
          <div className="absolute top-[15px] right-[15px] rounded-full text-red-400 text-12 leading-none font-bold tracking-wide">
            <RiErrorWarningFill className="text-20" />
          </div>
        </Tooltip>
      )}
      {state.status === 'published' && (
        <div className="absolute top-[15px] right-[15px] rounded-full text-green-300 text-12 leading-none font-bold tracking-wide">
          <RiCheckboxCircleFill className="text-20" />
        </div>
      )}
      <style jsx>{`
        .border-shadow {
          border: 2px solid hsl(212, 12%, 90%);
        }
        .fold {
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          display: -webkit-box;
        }
        .expand {
          max-height: unset !important;
          -webkit-line-clamp: unset !important;
        }
      `}</style>
    </div>
  );
});
