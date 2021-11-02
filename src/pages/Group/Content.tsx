import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { ago, sleep, urlify } from 'utils';
import classNames from 'classnames';
import { FiChevronDown } from 'react-icons/fi';
import { HiOutlineBan } from 'react-icons/hi';
import { RiErrorWarningFill, RiCheckboxCircleFill } from 'react-icons/ri';
import Tooltip from '@material-ui/core/Tooltip';
import { useStore } from 'store';
import { IContentItem } from 'apis/group';
import { Status } from 'store/group';
import usePrevious from 'hooks/usePrevious';
import useIsGroupOwner from 'store/deriveHooks/useIsGroupOwner';
import useActiveGroup from 'store/deriveHooks/useActiveGroup';
import useHasPermission from 'store/deriveHooks/useHasPermission';
import useAvatar from 'hooks/useAvatar';
import Loading from 'components/Loading';
import ContentMenu from './ContentMenu';
import Button from 'components/Button';
import { FilterType } from 'store/activeGroup';
import useSubmitContent from 'hooks/useSubmitContent';

export default observer((props: { content: IContentItem }) => {
  const { content } = props;
  const { activeGroupStore, authStore, nodeStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const { contentStatusMap } = activeGroupStore;
  const isCurrentGroupOwner = useIsGroupOwner(activeGroup);
  const hasPermission = useHasPermission(content.Publisher);
  const status = contentStatusMap[content.TrxId];
  const prevStatus = usePrevious(status);
  const state = useLocalStore(() => ({
    canExpand: false,
    expand: false,
    anchorEl: null,
    showSuccessChecker: false,
    showTrxModal: false,
  }));
  const avatarUrl = useAvatar(content.Publisher);
  const contentRef = React.useRef<any>();
  const submitContent = useSubmitContent();

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
    if (prevStatus === Status.PUBLISHING && status === Status.PUBLISHED) {
      (async () => {
        state.showSuccessChecker = true;
        await sleep(2000);
        state.showSuccessChecker = false;
      })();
    }
  }, [prevStatus, status]);

  const goToUserPage = async (publisher: string) => {
    activeGroupStore.setLoading(true);
    activeGroupStore.setFilterUserIds([publisher]);
    if (nodeStore.info.node_publickey === publisher) {
      activeGroupStore.setFilterType(FilterType.ME);
    } else {
      activeGroupStore.setFilterType(FilterType.SOMEONE);
    }
    await sleep(400);
    activeGroupStore.setLoading(false);
  };

  const isFilterSomeone = activeGroupStore.filterType == FilterType.SOMEONE;
  const isFilterMe = activeGroupStore.filterType == FilterType.ME;

  return (
    <div className="rounded-12 bg-white mt-3 px-8 py-6 w-[600px] box-border relative group">
      <div className="relative">
        <Tooltip
          disableHoverListener={isFilterSomeone || isFilterMe}
          enterDelay={300}
          enterNextDelay={300}
          PopperProps={{
            className: 'no-style',
          }}
          placement="left"
          title={UserCard(
            content.Publisher,
            avatarUrl,
            activeGroupStore.countMap[content.Publisher],
            goToUserPage
          )}
          interactive
        >
          <img
            onClick={() => goToUserPage(content.Publisher)}
            className="rounded-full border-shadow absolute top-0 left-0 overflow-hidden"
            src={avatarUrl}
            alt={content.Publisher}
            width="42"
            height="42"
          />
        </Tooltip>
        {isCurrentGroupOwner &&
          authStore.blacklistMap[
            `groupId:${activeGroup.GroupId}|userId:${content.Publisher}`
          ] && (
            <Tooltip
              disableHoverListener={isFilterSomeone || isFilterMe}
              enterDelay={300}
              enterNextDelay={300}
              placement="top"
              title={`已被禁止发布内容`}
              interactive
              arrow
            >
              <div className="text-18 text-white bg-red-400 rounded-full absolute top-0 left-0 -ml-2 z-10">
                <HiOutlineBan />
              </div>
            </Tooltip>
          )}
        <div className="pl-12 ml-2">
          <div className="flex items-center leading-none mt-3-px">
            <Tooltip
              disableHoverListener={isFilterSomeone || isFilterMe}
              enterDelay={300}
              enterNextDelay={300}
              PopperProps={{
                className: 'no-style',
              }}
              placement="left"
              title={UserCard(
                content.Publisher,
                avatarUrl,
                activeGroupStore.countMap[content.Publisher],
                goToUserPage
              )}
              interactive
            >
              <div
                className="text-gray-88 font-bold"
                onClick={() => goToUserPage(content.Publisher)}
              >
                {content.Publisher.slice(-10, -2)}
              </div>
            </Tooltip>
            <div className="px-2 text-gray-99 opacity-50">·</div>
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
              'mt-2 text-gray-4a break-words whitespace-pre-wrap tracking-wide markdown'
            )}
            dangerouslySetInnerHTML={{
              __html: hasPermission
                ? urlify(content.Content.content)
                : `<div class="text-red-400">Ta 被禁言了，内容无法显示</div>`,
            }}
          />
          {!state.expand && state.canExpand && (
            <div className="relative mt-6-px pb-2">
              <div
                className="text-blue-400 cursor-pointer tracking-wide flex justify-center items-center text-12 absolute w-full top-1 left-0"
                onClick={() => (state.expand = true)}
              >
                展开
                <FiChevronDown className="text-16 ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>
      {status === Status.PUBLISHING && (
        <Tooltip placement="top" title="正在同步给所有节点" arrow>
          <div className="absolute top-[17px] right-[17px] rounded-full text-12 leading-none font-bold tracking-wide">
            <Loading size={16} />
          </div>
        </Tooltip>
      )}
      {status === Status.FAILED && (
        <Tooltip
          placement="top"
          title="出块节点都不在线，您发布的内容暂时存储在本地，点击可以重新发送"
          arrow
        >
          <div
            className="absolute top-[15px] right-[15px] rounded-full text-red-400 text-12 leading-none font-bold tracking-wide"
            onClick={async () => {
              try {
                await submitContent({
                  content: content.Content.content,
                });
                activeGroupStore.deleteContent(content.TrxId);
                activeGroupStore.deletePendingContents([content.TrxId]);
              } catch (err) {
                console.error(err);
                snackbarStore.show({
                  message: '貌似出错了',
                  type: 'error',
                });
              }
            }}
          >
            <RiErrorWarningFill className="text-20" />
          </div>
        </Tooltip>
      )}
      {state.showSuccessChecker && (
        <div className="absolute top-[15px] right-[15px] rounded-full text-green-300 text-12 leading-none font-bold tracking-wide">
          <RiCheckboxCircleFill className="text-20" />
        </div>
      )}
      {status === Status.PUBLISHED && !state.showSuccessChecker && (
        <ContentMenu content={content} />
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

function UserCard(
  publisher: string,
  avatarUrl: string,
  count: number,
  goToUserPage: any
) {
  const { activeGroupStore, nodeStore } = useStore();
  const isMe = nodeStore.info.node_publickey === publisher;
  return (
    <div className="p-5 flex items-center justify-between bg-white rounded-8 border border-gray-d8 mr-2 shadow-lg">
      <div
        className="relative pl-12 mr-10 cursor-pointer"
        onClick={() => goToUserPage(publisher)}
      >
        <img
          className="rounded-full border-shadow absolute top-0 left-0 overflow-hidden"
          src={avatarUrl}
          alt={publisher}
          width="42"
          height="42"
        />
        <div className="pt-1 w-[75px] pl-[2px]">
          <div className="text-gray-88 font-bold text-14">
            {publisher.slice(-10, -2)}
          </div>
          <div className="mt-[4px] text-12 text-gray-af tracking-wide">
            {count || 0} 条内容
          </div>
        </div>
      </div>
      {!isMe && (
        <div className="w-20 flex justify-end">
          {activeGroupStore.followingSet.has(publisher) ? (
            <Button
              size="small"
              outline
              onClick={() => {
                activeGroupStore.deleteFollowing(publisher);
              }}
            >
              正在关注
            </Button>
          ) : (
            <Button
              size="small"
              onClick={() => {
                activeGroupStore.addFollowing(publisher);
              }}
            >
              关注
            </Button>
          )}
        </div>
      )}
      <style jsx>{`
        .border-shadow {
          border: 2px solid hsl(212, 12%, 90%);
        }
      `}</style>
    </div>
  );
}
