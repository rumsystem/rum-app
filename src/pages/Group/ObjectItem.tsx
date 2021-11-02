import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { ago, sleep, urlify } from 'utils';
import classNames from 'classnames';
import { FiChevronDown } from 'react-icons/fi';
import { HiOutlineBan } from 'react-icons/hi';
import { RiErrorWarningFill, RiCheckboxCircleFill } from 'react-icons/ri';
import Tooltip from '@material-ui/core/Tooltip';
import { useStore } from 'store';
import usePrevious from 'hooks/usePrevious';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useHasPermission from 'store/selectors/useHasPermission';
import getProfile from 'store/selectors/getProfile';
import Loading from 'components/Loading';
import ObjectMenu from './ObjectMenu';
import Button from 'components/Button';
import { FilterType } from 'store/activeGroup';
import useSubmitObject from 'hooks/useSubmitObject';
import Database, { IDbDerivedObjectItem, ContentStatus } from 'store/database';

export default observer((props: { object: IDbDerivedObjectItem }) => {
  const { object } = props;
  const { activeGroupStore, authStore, nodeStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const { timeoutObjectSet } = activeGroupStore;
  const isCurrentGroupOwner = useIsGroupOwner(activeGroup);
  const hasPermission = useHasPermission(object.Publisher);
  const status = object.Status;
  const prevStatus = usePrevious(status);
  const isMe = nodeStore.info.node_publickey === object.Publisher;
  const state = useLocalObservable(() => ({
    canExpand: false,
    expand: false,
    anchorEl: null,
    showSuccessChecker: false,
    showTrxModal: false,
  }));
  const profile = getProfile(
    object.Publisher,
    isMe
      ? activeGroupStore.person
      : activeGroupStore.personMap[object.Publisher]
  );
  const objectRef = React.useRef<any>();
  const submitObject = useSubmitObject();
  const isFilterSomeone = activeGroupStore.filterType == FilterType.SOMEONE;
  const isFilterMe = activeGroupStore.filterType == FilterType.ME;

  React.useEffect(() => {
    if (
      objectRef.current &&
      objectRef.current.scrollHeight > objectRef.current.clientHeight
    ) {
      state.canExpand = true;
    } else {
      state.canExpand = false;
    }
  }, []);

  React.useEffect(() => {
    if (
      prevStatus === ContentStatus.Syncing &&
      status === ContentStatus.Synced
    ) {
      (async () => {
        state.showSuccessChecker = true;
        await sleep(2500);
        state.showSuccessChecker = false;
      })();
    }
  }, [prevStatus, status]);

  const goToUserPage = async (publisher: string) => {
    if (isFilterSomeone || isFilterMe) {
      return;
    }
    activeGroupStore.setFilterUserIdSet([publisher]);
    if (nodeStore.info.node_publickey === publisher) {
      activeGroupStore.setFilterType(FilterType.ME);
    } else {
      activeGroupStore.setFilterType(FilterType.SOMEONE);
    }
  };

  return (
    <div className="rounded-12 bg-white mt-3 px-8 py-6 w-full lg:w-[600px] box-border relative group">
      <div className="relative">
        <Tooltip
          disableHoverListener={isFilterSomeone || isFilterMe}
          enterDelay={450}
          enterNextDelay={450}
          PopperProps={{
            className: 'no-style',
          }}
          placement="left"
          title={UserCard({
            name: profile.name,
            avatar: profile.avatar,
            publisher: object.Publisher,
            count: object.Summary ? object.Summary.Count : 0,
            goToUserPage,
          })}
          interactive
        >
          <img
            onClick={() => goToUserPage(object.Publisher)}
            className="rounded-full border-shadow absolute top-[-2px] left-0 overflow-hidden"
            src={profile.avatar}
            alt={object.Publisher}
            width="42"
            height="42"
          />
        </Tooltip>
        {isCurrentGroupOwner &&
          authStore.blacklistMap[
            `groupId:${activeGroup.GroupId}|userId:${object.Publisher}`
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
              enterDelay={450}
              enterNextDelay={450}
              PopperProps={{
                className: 'no-style',
              }}
              placement="left"
              title={UserCard({
                name: profile.name,
                avatar: profile.avatar,
                publisher: object.Publisher,
                count: object.Summary ? object.Summary.Count : 0,
                goToUserPage,
              })}
              interactive
            >
              <div
                className="text-gray-88 font-bold"
                onClick={() => goToUserPage(object.Publisher)}
              >
                {profile.name}
              </div>
            </Tooltip>
            <div className="px-2 text-gray-99 opacity-50">·</div>
            <div className="text-12 text-gray-af tracking-wide">
              {ago(new Date(object.TimeStamp / 1000000).toISOString())}
            </div>
          </div>
          <div
            ref={objectRef}
            className={classNames(
              {
                expand: state.expand,
                fold: !state.expand,
              },
              'mt-2 text-gray-4a break-all whitespace-pre-wrap tracking-wide markdown'
            )}
            dangerouslySetInnerHTML={{
              __html: hasPermission
                ? urlify(object.Content.content || ' ')
                : `<div class="text-red-400">Ta 被禁言了，内容无法显示</div>`,
            }}
          />
          {!state.expand && state.canExpand && (
            <div className="relative mt-6-px pb-2">
              <div
                className="text-blue-400 cursor-pointer tracking-wide flex justify-center items-center text-12 absolute w-full top-1 left-0 mt-[-6px]"
                onClick={() => (state.expand = true)}
              >
                展开
                <FiChevronDown className="text-16 ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>
      {status === ContentStatus.Syncing && (
        <Tooltip placement="top" title="正在同步给所有节点" arrow>
          <div className="absolute top-[17px] right-[17px] rounded-full text-12 leading-none font-bold tracking-wide">
            <Loading size={16} />
          </div>
        </Tooltip>
      )}
      {timeoutObjectSet.has(object.TrxId) && (
        <Tooltip
          placement="top"
          title="出块节点都不在线，您发布的内容暂时存储在本地，点击可以重新发送"
          arrow
        >
          <div
            className="absolute top-[15px] right-[15px] rounded-full text-red-400 text-12 leading-none font-bold tracking-wide"
            onClick={async () => {
              try {
                await submitObject({
                  content: object.Content.content,
                });
                activeGroupStore.deleteObject(object.TrxId);
                await new Database().objects
                  .where({
                    GroupId: activeGroupStore.id,
                    TrxId: object.TrxId,
                  })
                  .delete();
                snackbarStore.show({
                  message: '已重新发布',
                });
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
      {status === ContentStatus.Synced && !state.showSuccessChecker && (
        <ObjectMenu object={object} />
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

function UserCard(props: {
  name: string;
  publisher: string;
  avatar: string;
  count: number;
  goToUserPage: any;
}) {
  const { activeGroupStore, nodeStore } = useStore();
  const isMe = nodeStore.info.node_publickey === props.publisher;
  return (
    <div className="p-5 flex items-center justify-between bg-white rounded-8 border border-gray-d8 mr-2 shadow-lg">
      <div
        className="relative pl-[50px] mr-10 cursor-pointer py-1"
        onClick={() => props.goToUserPage(props.publisher)}
      >
        <img
          className="rounded-full border-shadow absolute top-0 left-0 overflow-hidden"
          src={props.avatar}
          alt={props.name}
          width="50"
          height="50"
        />
        <div className="pl-3 pt-1 w-[90px]">
          <div className="text-gray-88 font-bold text-14 truncate">
            {props.name}
          </div>
          <div className="mt-[6px] text-12 text-gray-af tracking-wide opacity-90">
            {props.count || 0} 条内容
          </div>
        </div>
      </div>

      {isMe && (
        <div className="w-20 flex justify-end">
          <Button
            size="small"
            outline
            onClick={() => props.goToUserPage(props.publisher)}
          >
            主页
          </Button>
        </div>
      )}

      {!isMe && (
        <div className="w-20 flex justify-end">
          {activeGroupStore.followingSet.has(props.publisher) ? (
            <Button
              size="small"
              outline
              onClick={async () => {
                await activeGroupStore.deleteFollowing({
                  groupId: activeGroupStore.id,
                  publisher: nodeStore.info.node_publickey,
                  following: props.publisher,
                });
              }}
            >
              已关注
            </Button>
          ) : (
            <Button
              size="small"
              onClick={async () => {
                await activeGroupStore.addFollowing({
                  groupId: activeGroupStore.id,
                  publisher: nodeStore.info.node_publickey,
                  following: props.publisher,
                });
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
