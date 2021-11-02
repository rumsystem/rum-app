import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { ago, sleep, urlify } from 'utils';
import classNames from 'classnames';
import { FiChevronDown } from 'react-icons/fi';
import { HiOutlineBan, HiOutlineCheckCircle } from 'react-icons/hi';
import {
  RiErrorWarningFill,
  RiCheckboxCircleFill,
  RiMoreFill,
} from 'react-icons/ri';
import Loading from 'components/Loading';
import Tooltip from '@material-ui/core/Tooltip';
import GroupApi, { IContentItem } from 'apis/group';
import { Status } from 'store/group';
import { useStore } from 'store';
import { Menu, MenuItem } from '@material-ui/core';
import usePrevious from 'hooks/usePrevious';
import useIsGroupOwner from 'hooks/useIsGroupOwner';
import TrxModal from './TrxModal';
import { MdInfoOutline } from 'react-icons/md';

export default observer((props: { content: IContentItem }) => {
  const {
    groupStore,
    nodeStore,
    authStore,
    snackbarStore,
    confirmDialogStore,
  } = useStore();
  const { statusMap } = groupStore;
  const isCurrentGroupOwner = useIsGroupOwner(groupStore.group);

  const { content } = props;
  const status = statusMap[content.TrxId];
  const prevStatus = usePrevious(status);
  const state = useLocalStore(() => ({
    canExpand: false,
    expand: false,
    anchorEl: null,
    showSuccessChecker: false,
    showTrxModal: false,
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
    if (prevStatus === Status.PUBLISHING && status === Status.PUBLISHED) {
      (async () => {
        state.showSuccessChecker = true;
        await sleep(2000);
        state.showSuccessChecker = false;
      })();
    }
  }, [prevStatus, status]);

  const handleMenuClick = (event: any) => {
    state.anchorEl = event.currentTarget;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const ban = (userId: any) => {
    handleMenuClose();
    confirmDialogStore.show({
      content: '确定禁止 Ta 发布内容？',
      okText: '确定',
      ok: async () => {
        try {
          await GroupApi.createBlacklist({
            type: 'Add',
            object: {
              type: 'Auth',
              id: userId,
            },
            target: {
              id: groupStore.id,
              type: 'Group',
            },
          });
          confirmDialogStore.hide();
          await sleep(200);
          snackbarStore.show({
            message: '请求已提交，等待其他节点同步',
            duration: 2500,
          });
        } catch (err) {
          console.error(err);
          snackbarStore.show({
            message: '貌似出错了',
            type: 'error',
          });
        }
      },
    });
  };

  const allow = (userId: any) => {
    handleMenuClose();
    confirmDialogStore.show({
      content: '确定允许 Ta 发布内容？',
      okText: '确定',
      ok: async () => {
        try {
          await GroupApi.createBlacklist({
            type: 'Remove',
            object: {
              type: 'Auth',
              id: userId,
            },
            target: {
              id: groupStore.id,
              type: 'Group',
            },
          });
          confirmDialogStore.hide();
          await sleep(200);
          snackbarStore.show({
            message: '请求已提交，等待其他节点同步',
            duration: 2500,
          });
        } catch (err) {
          console.error(err);
          snackbarStore.show({
            message: '貌似出错了',
            type: 'error',
          });
        }
      },
    });
  };

  const openTrxModal = () => {
    handleMenuClose();
    state.showTrxModal = true;
  };

  const closeTrxModal = () => {
    state.showTrxModal = false;
  };

  const publisher = content.Publisher || nodeStore.info.user_id;

  return (
    <div className="rounded-12 bg-white mt-3 px-8 py-6 w-[600px] box-border relative group">
      <div className="relative">
        <img
          className="rounded-full border-shadow absolute top-0 left-0"
          src={`https://api.multiavatar.com/${publisher}.svg?apikey=pg6ZuIQncvJ8jG`}
          alt={publisher}
          width="42"
          height="42"
        />
        {isCurrentGroupOwner &&
          authStore.blacklistMap[
            `groupId:${groupStore.id}|userId:${publisher}`
          ] && (
            <Tooltip
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
              placement="top"
              title={`节点 ID：${publisher}`}
              interactive
              arrow
            >
              <div className="text-gray-88 font-bold">
                {publisher.slice(-8)}
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
              __html: urlify(content.Content.content),
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
          title="暂无出块节点在线，您发布的内容暂时存储在本地"
          arrow
        >
          <div className="absolute top-[15px] right-[15px] rounded-full text-red-400 text-12 leading-none font-bold tracking-wide">
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
        <div>
          <div
            className="absolute top-[8px] right-[8px] text-gray-9b p-2 opacity-80"
            onClick={handleMenuClick}
          >
            <RiMoreFill className="text-20" />
          </div>

          <Menu
            anchorEl={state.anchorEl}
            keepMounted
            open={Boolean(state.anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              style: {
                margin: '27px 0 0 20px',
              },
            }}
          >
            <MenuItem onClick={() => openTrxModal()}>
              <div className="flex items-center text-gray-600 leading-none pl-1 py-2 font-bold pr-5">
                <span className="flex items-center mr-3">
                  <MdInfoOutline className="text-18 opacity-50" />
                </span>
                详情
              </div>
            </MenuItem>
            {isCurrentGroupOwner && nodeStore.info.user_id !== publisher && (
              <div>
                {!authStore.blacklistMap[
                  `groupId:${groupStore.id}|userId:${publisher}`
                ] && (
                  <MenuItem onClick={() => ban(publisher)}>
                    <div className="flex items-center text-red-400 leading-none pl-1 py-2 font-bold pr-2">
                      <span className="flex items-center mr-3">
                        <HiOutlineBan className="text-18 opacity-50" />
                      </span>
                      <span>禁止 Ta 发布</span>
                    </div>
                  </MenuItem>
                )}
                {authStore.blacklistMap[
                  `groupId:${groupStore.id}|userId:${publisher}`
                ] && (
                  <MenuItem onClick={() => allow(publisher)}>
                    <div className="flex items-center text-green-500 leading-none pl-1 py-2 font-bold pr-2">
                      <span className="flex items-center mr-3">
                        <HiOutlineCheckCircle className="text-18 opacity-80" />
                      </span>
                      <span>允许 Ta 发布</span>
                    </div>
                  </MenuItem>
                )}
              </div>
            )}
          </Menu>
        </div>
      )}
      <TrxModal
        trxId={content.TrxId}
        open={state.showTrxModal}
        onClose={closeTrxModal}
      />
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
