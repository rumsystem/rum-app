import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import { BsFillCaretDownFill } from 'react-icons/bs';
import { HiOutlineBan } from 'react-icons/hi';
import Tooltip from '@material-ui/core/Tooltip';
import { useStore } from 'store';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useHasPermission from 'store/selectors/useHasPermission';
import ObjectMenu from './ObjectMenu';
import ObjectItemBottom from './ObjectItemBottom';
import Button from 'components/Button';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import { ObjectsFilterType } from 'store/activeGroup';
import Avatar from 'components/Avatar';
import ContentSyncStatus from 'components/ContentSyncStatus';
import BFSReplace from 'utils/BFSReplace';
import escapeStringRegexp from 'escape-string-regexp';
import { IProfile } from 'store/group';

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
  disabledUserCardTooltip?: boolean
  withBorder?: boolean
  beforeGoToUserPage?: () => unknown | Promise<unknown>
}

export default observer((props: IProps) => {
  const { object } = props;
  const { activeGroupStore, authStore } = useStore();
  const activeGroup = useActiveGroup();
  const isCurrentGroupOwner = useIsGroupOwner(activeGroup);
  const hasPermission = useHasPermission(object.Publisher);
  const state = useLocalObservable(() => ({
    canExpandContent: false,
    expandContent: props.inObjectDetailModal || false,
    anchorEl: null,
    showSuccessChecker: false,
    showTrxModal: false,
  }));
  const objectRef = React.useRef<HTMLDivElement>(null);
  const { content } = object.Content;
  const { searchText, profileMap } = activeGroupStore;
  const profile = profileMap[object.Publisher];

  const goToUserPage = async (publisher: string) => {
    if (props.beforeGoToUserPage) {
      await props.beforeGoToUserPage();
    }
    activeGroupStore.setObjectsFilter({
      type: ObjectsFilterType.SOMEONE,
      publisher,
    });
  };

  React.useEffect(() => {
    if (props.inObjectDetailModal) {
      return;
    }
    if (
      objectRef.current
      && objectRef.current.scrollHeight > objectRef.current.clientHeight
    ) {
      state.canExpandContent = true;
    } else {
      state.canExpandContent = false;
    }
  }, []);

  // replace link and search text
  React.useEffect(() => {
    const box = objectRef.current;
    if (!box) {
      return;
    }

    BFSReplace(
      box,
      /(https?:\/\/[^\s]+)/g,
      (text: string) => {
        const link = document.createElement('a');
        link.href = text;
        link.className = 'text-blue-400';
        link.textContent = text;
        return link;
      },
    );

    if (searchText) {
      BFSReplace(
        box,
        new RegExp(escapeStringRegexp(searchText), 'g'),
        (text: string) => {
          const span = document.createElement('span');
          span.textContent = text;
          span.className = 'text-yellow-500 font-bold';
          return span;
        },
      );
    }
  }, [searchText, content]);

  return (
    <div className={classNames({
      'border border-gray-f2': props.withBorder,
    }, 'rounded-12 bg-white px-8 pt-6 pb-3 w-full lg:w-[600px] box-border relative mb-[10px]')}
    >
      <div className="relative">
        <Tooltip
          disableHoverListener={props.disabledUserCardTooltip}
          enterDelay={450}
          enterNextDelay={450}
          PopperProps={{
            className: 'no-style',
          }}
          placement="left"
          title={UserCard({
            object,
            profile,
            goToUserPage,
          })}
          interactive
        >
          <div>
            <Avatar
              className="absolute top-[-6px] left-[-4px]"
              profile={profile}
              size={44}
              onClick={() => {
                goToUserPage(object.Publisher);
              }}
            />
          </div>
        </Tooltip>
        {isCurrentGroupOwner
          && authStore.blacklistMap[
            `groupId:${activeGroup.GroupId}|userId:${object.Publisher}`
          ] && (
          <Tooltip
            enterDelay={300}
            enterNextDelay={300}
            placement="top"
            title="已被禁止发布内容"
            interactive
            arrow
          >
            <div className="text-18 text-white bg-red-400 rounded-full absolute top-0 left-0 -ml-2 z-10">
              <HiOutlineBan />
            </div>
          </Tooltip>
        )}
        <div className="pl-12 ml-1">
          <div className="flex items-center leading-none pt-[1px]">
            <Tooltip
              disableHoverListener={props.disabledUserCardTooltip}
              enterDelay={450}
              enterNextDelay={450}
              PopperProps={{
                className: 'no-style',
              }}
              placement="left"
              title={UserCard({
                object,
                profile,
                goToUserPage,
              })}
              interactive
            >
              <div
                className="text-gray-4a font-bold"
                onClick={() => {
                  goToUserPage(object.Publisher);
                }}
              >
                {profile.name}
              </div>
            </Tooltip>
          </div>
          <div
            ref={objectRef}
            key={content + searchText}
            className={classNames(
              {
                expandContent: state.expandContent,
                fold: !state.expandContent,
              },
              'mt-[8px] text-gray-4a break-all whitespace-pre-wrap tracking-wide markdown',
            )}
            dangerouslySetInnerHTML={{
              __html: hasPermission
                ? content
                : '<div class="text-red-400">Ta 被禁言了，内容无法显示</div>',
            }}
          />
          {!state.expandContent && state.canExpandContent && (
            <div className="relative mt-6-px pb-2">
              <div
                className="text-blue-400 cursor-pointer tracking-wide flex items-center text-12 absolute w-full top-1 left-0 mt-[-6px]"
                onClick={() => { state.expandContent = true; }}
              >
                展开
                <BsFillCaretDownFill className="text-12 ml-[1px] opacity-70" />
              </div>
            </div>
          )}
        </div>
      </div>

      <ObjectItemBottom
        object={object}
        inObjectDetailModal={props.inObjectDetailModal}
      />

      <ContentSyncStatus
        positionClassName="absolute top-[15px] right-[15px]"
        status={object.Status}
        SyncedComponent={() => <ObjectMenu object={object} />}
      />
      <style jsx>{`
        .fold {
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          display: -webkit-box;
        }
        .expandContent {
          max-height: unset !important;
          -webkit-line-clamp: unset !important;
        }
      `}</style>
    </div>
  );
});

const UserCard = (props: {
  object: IDbDerivedObjectItem
  profile: IProfile
  goToUserPage: (publisher: string) => void
}) => {
  const { object, profile, goToUserPage } = props;
  const { modalStore } = useStore();
  const { user } = object.Extra;
  return (
    <div className="p-5 flex items-center justify-between bg-white rounded-8 border border-gray-d8 mr-2 shadow-lg">
      <div
        className="relative pl-[50px] mr-10 cursor-pointer py-1"
        onClick={() => {
          goToUserPage(user.publisher);
        }}
      >
        <Avatar
          className="absolute top-0 left-0 cursor-pointer"
          profile={profile}
          size={50}
        />
        <div className="pl-3 pt-1 w-[90px]">
          <div className="text-gray-88 font-bold text-14 truncate">
            {profile.name}
          </div>
          <div className="mt-[6px] text-12 text-gray-af tracking-wide opacity-90">
            {user.objectCount || 0} 条内容
          </div>
        </div>
      </div>

      <div className="w-16 flex flex-col">
        <Button
          size="mini"
          outline
          onClick={() => {
            goToUserPage(user.publisher);
          }}
        >
          主页
        </Button>

        {
          profile?.mixinUID && (
            <Button
              className="mt-1"
              size="mini"
              outline
              onClick={() => {
                modalStore.mixinPayment.show({
                  name: profile.name || '',
                  mixinUID: profile.mixinUID || '',
                });
              }}
            >
              打赏
            </Button>
          )
        }
      </div>
    </div>
  );
};
