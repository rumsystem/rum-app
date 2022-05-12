
import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import GroupItem from './GroupItem';
import { IGroup } from 'apis/group';
import { ListType } from './ListTypeSwitcher';
import classNames from 'classnames';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useStore } from 'store';
import { TextField, Badge } from '@material-ui/core';
import { AiOutlineCaretRight, AiOutlineCaretDown } from 'react-icons/ai';
import { IoMdClose, IoMdAddCircleOutline } from 'react-icons/io';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { BiCog } from 'react-icons/bi';
import { lang } from 'utils/lang';
import { sum, keyBy } from 'lodash';
import { IGroupFolder } from 'store/sidebar';
import { myGroup } from 'standaloneModals/myGroup';
import usePrevious from 'hooks/usePrevious';

type IGroupItem = IGroup & {
  isOwner: boolean
};

interface IProps {
  groups: IGroupItem[]
  highlight: string
  listType: ListType
  handleOpenGroup: (groupId: string) => void
}

const DEFAULT_FOLDER_UUID = '00000000-0000-0000-0000-000000000000';
const FOLDER_DROPPABLE_ID = 'FOLDER_DROPPABLE_ID';

export default observer((props: IProps) => {
  const {
    sidebarStore,
    confirmDialogStore,
  } = useStore();
  const { groupFolders, groupFolderMap } = sidebarStore;
  const prevGroupLength = usePrevious(props.groups.length) || 0;

  const groupMap = React.useMemo(() => keyBy(props.groups, 'group_id'), [props.groups.length]);

  React.useEffect(() => {
    sidebarStore.initGroupFolders();
    const { groupFolderMap, inFolderGroupIdSet } = sidebarStore;
    const defaultFolder = groupFolderMap[DEFAULT_FOLDER_UUID];
    if (!defaultFolder) {
      const items = [];
      for (const group of props.groups) {
        if (!inFolderGroupIdSet.has(group.group_id)) {
          items.push(group.group_id);
        }
      }
      sidebarStore.unshiftGroupFolder({
        id: DEFAULT_FOLDER_UUID,
        name: lang.default,
        items,
        expand: true,
      });
    }
  }, []);

  React.useEffect(() => {
    if (prevGroupLength > 0 && prevGroupLength - 1 === props.groups.length) {
      const groupIdSet = new Set(props.groups.map((group) => group.group_id));
      for (const folder of groupFolders) {
        const items = [];
        for (const item of folder.items) {
          if (groupIdSet.has(item)) {
            items.push(item);
          }
        }
        if (items.length !== folder.items.length) {
          folder.items = items;
          sidebarStore.updateGroupFolder(folder.id, folder);
        }
      }
    }
  }, [props.groups.length, prevGroupLength]);

  const onDragEnd = (ret: DropResult) => {
    if (!ret.destination) {
      return;
    }

    console.log(ret);

    // drag folder
    if (ret.destination.droppableId === FOLDER_DROPPABLE_ID) {
      const [removed] = groupFolders.splice(ret.source.index, 1);
      groupFolders.splice(ret.destination.index, 0, removed);
      sidebarStore.setGroupFolders(groupFolders);
      return;
    }

    // drag group
    const destFolder = groupFolderMap[ret.destination.droppableId];
    const sourceFolder = groupFolderMap[ret.source.droppableId];
    if (destFolder && sourceFolder) {
      const [removed] = sourceFolder.items.splice(ret.source.index, 1);
      destFolder.items.splice(ret.destination.index, 0, removed);
      destFolder.expand = true;
      sidebarStore.updateGroupFolder(destFolder.id, destFolder);
      if (destFolder !== sourceFolder) {
        sidebarStore.updateGroupFolder(sourceFolder.id, sourceFolder);
      }
    }
  };

  return (
    <div>
      {/* trigger mobx updater */}
      <div className="hidden">
        {groupFolders.map((groupFolder) => (
          <div key={groupFolder.name}>
            {groupFolder.expand}
            {groupFolder.name}
          </div>
        ))}
      </div>
      <DragDropContext
        onDragEnd={onDragEnd}
      >
        <Droppable
          droppableId={FOLDER_DROPPABLE_ID}
          type="COLUMN"
        >
          {(provided, _snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {groupFolders.map((groupFolder, index) => (
                <Draggable key={groupFolder.id} draggableId={groupFolder.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={classNames({
                        'opacity-40': snapshot.isDragging,
                      })}
                    >
                      <div key={groupFolder.id}>
                        <Droppable
                          droppableId={groupFolder.id}
                        >
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              <Folder
                                groupFolder={groupFolder}
                                update={(id, name) => {
                                  sidebarStore.updateGroupFolder(id, {
                                    ...groupFolderMap[id],
                                    name,
                                  });
                                }}
                                remove={(id) => {
                                  if (groupFolder.name) {
                                    confirmDialogStore.show({
                                      content: '确定删除分组吗？',
                                      okText: lang.yes,
                                      ok: () => {
                                        sidebarStore.removeGroupFolder(id);
                                        confirmDialogStore.hide();
                                      },
                                    });
                                  } else {
                                    sidebarStore.removeGroupFolder(id);
                                  }
                                }}
                                expand={!!groupFolder.expand}
                                toggleExpand={(id: string) => {
                                  sidebarStore.updateGroupFolder(id, {
                                    ...groupFolderMap[id],
                                    expand: !groupFolderMap[id].expand,
                                  });
                                }}
                                highlight={snapshot.isDraggingOver}
                              />
                              {groupFolder.expand && groupFolder.items.map((groupId) => groupMap[groupId]).map((group, index) => {
                                if (!group) {
                                  return null;
                                }
                                return (
                                  <Draggable key={group.group_id} draggableId={group.group_id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={classNames({
                                          'opacity-40': snapshot.isDragging,
                                        })}
                                      >
                                        <GroupItem
                                          group={group}
                                          onOpen={() => props.handleOpenGroup(group.group_id)}
                                          highlight={props.highlight || ''}
                                          listType={props.listType}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="h-20">
        <div className={classNames(
          sidebarStore.collapsed && 'hidden',
          'w-[280px] fixed bottom-0 left-0 flex items-center bg-gray-f2 text-gray-70 py-1 text-12 cursor-pointer',
        )}
        >
          <div
            className="flex-1 py-1 flex items-center justify-center border-r-2 border-white"
            onClick={() => {
              myGroup();
            }}
          >
            <BiCog className="mr-1 text-16 opacity-75" />
            {lang.myGroup}
          </div>
          <div className="flex-1 py-1 flex items-center justify-center" onClick={() => sidebarStore.addEmptyGroupFolder()}>
            <IoMdAddCircleOutline className="mr-1 text-16 opacity-80" />
            新建分组
          </div>
        </div>

        <style jsx global>{`
          .sidebar-folder-input .MuiOutlinedInput-input {
            padding: 6px 10px !important;
          }
        `}</style>
      </div>
    </div>
  );
});

interface IFolderProps {
  groupFolder: IGroupFolder
  update: (id: string, name: string) => void
  remove: (id: string) => void
  expand: boolean
  toggleExpand: (id: string) => void
  highlight: boolean
}

const Folder = observer((props: IFolderProps) => {
  const { latestStatusStore } = useStore();
  const folder = props.groupFolder;
  const state = useLocalObservable(() => ({
    name: folder.name,
    creating: !folder.name,
    editing: false,
  }));

  const showInput = state.creating || state.editing;
  const unreadCount = folder.items
    .map((groupId) => {
      const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
      return latestStatus.unreadCount;
    })
    .reduce((p, c) => p + c, 0);
  const showUnreadCount = unreadCount > 0;
  const notificationCount = folder.items
    .map((groupId) => {
      const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
      return sum(Object.values(latestStatus.notificationUnreadCountMap || {}));
    })
    .reduce((p, c) => p + c, 0);
  const showNotificationBadge = !showUnreadCount && !props.expand && notificationCount > 0;
  const isDefaultFolder = folder.id === DEFAULT_FOLDER_UUID;

  return (
    <div className={classNames({
      'bg-blue-400 text-white': props.highlight,
      'bg-gray-f2 text-gray-88': !props.highlight,
    }, 'flex items-center pl-[2px] pr-2 h-9 cursor-pointer group')}
    >
      {!showInput && (
        <div className="text-22 mr-1 opacity-50" onClick={() => props.toggleExpand(folder.id)}>
          {props.expand ? <AiOutlineCaretDown className="transform scale-x-75" /> : <AiOutlineCaretRight className="transform scale-y-75" />}
        </div>
      )}
      {!showInput && (
        <div
          className="flex-1 flex items-center justify-between"
          onClick={() => props.toggleExpand(folder.id)}
        >
          <div className="w-50 group-hover:w-40 truncate mr-2">
            {folder.name}
            {folder.items.length > 0 && (
              <span className="tracking-wider">
                {' '}({folder.items.length})
              </span>
            )}
          </div>
          {!isDefaultFolder && (
            <div
              className="hidden group-hover:flex items-center opacity-70"
            >
              <div
                className="p-1 mr-1"
                onClick={(e) => {
                  state.name = folder.name;
                  state.editing = true;
                  e.stopPropagation();
                }}
              >
                <MdOutlineModeEditOutline className="text-16 opacity-80" />
              </div>
              <div
                className="p-1"
                onClick={(e) => {
                  props.remove(folder.id);
                  e.stopPropagation();
                }}
              >
                <IoMdClose className="text-18" />
              </div>
            </div>
          )}
          {showUnreadCount && (
            <div
              className="flex group-hover:hidden items-center opacity-80 text-12"
            >
              <div
                className="pr-2"
              >
                {unreadCount}
              </div>
            </div>
          )}
          {showNotificationBadge && (
            <div
              className="flex group-hover:hidden items-center"
            >
              <div
                className="pr-3"
              >
                <Badge
                  className="transform scale-90"
                  classes={{
                    badge: 'bg-red-500',
                  }}
                  invisible={false}
                  variant="dot"
                />
              </div>
            </div>
          )}
        </div>
      )}
      {showInput && (
        <TextField
          className="flex-1 sidebar-folder-input mx-4"
          size="small"
          value={state.name}
          autoFocus
          onChange={(e) => {
            state.name = e.target.value;
          }}
          onKeyDown={(e: any) => {
            const name = state.name.trim();
            if (e.key === 'Enter') {
              if (name) {
                props.update(folder.id, name);
              }
              state.name = '';
              state.creating = false;
              state.editing = false;
            }
          }}
          onBlur={() => {
            const name = state.name.trim();
            if (name) {
              props.update(folder.id, name);
            } else if (state.creating) {
              props.remove(folder.id);
            }
            state.name = '';
            state.creating = false;
            state.editing = false;
          }}
          margin="none"
          variant="outlined"
        />
      )}
    </div>
  );
});