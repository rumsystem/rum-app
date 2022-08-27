import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import GroupItem from './GroupItem';
import { IGroup } from 'apis/group';
import { ListType } from './ListTypeSwitcher';
import classNames from 'classnames';
import { useStore } from 'store';
import { TextField, Badge } from '@material-ui/core';
import { AiOutlineCaretRight, AiOutlineCaretDown } from 'react-icons/ai';
import { IoMdClose, IoMdAddCircleOutline } from 'react-icons/io';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { lang } from 'utils/lang';
import { sum } from 'lodash';
import { IGroupFolder } from 'store/sidebar';
import usePrevious from 'hooks/usePrevious';
import { BiCog } from 'react-icons/bi';
import { myGroup } from 'standaloneModals/myGroup';

import {
  DndContext,
  PointerSensor,
  useSensors,
  useSensor,
  MeasuringStrategy,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useCollisionDetectionStrategy from './dndKitHooks/useCollisionDetectionStrategy';
import { sortableState } from './sortableState';

interface IProps {
  groups: IGroup[]
  highlight: string
  listType: ListType
}

interface ContainerProps {
  groupFolder: IGroupFolder
  children: React.ReactNode
  style?: React.CSSProperties
  isHorizontal: boolean
  highlight: boolean
}

export default observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    activeId: '',
  }));
  const {
    sidebarStore,
    groupStore,
  } = useStore();
  const { groupFolders, groupFolderMap, groupBelongsToFolderMap } = sidebarStore;
  const prevGroupLength = usePrevious(props.groups.length) || 0;
  const groupMap = groupStore.map;
  const totalGroups = groupStore.groups.length;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  const lastOverId = React.useRef<UniqueIdentifier | null>(null);
  const isHorizontal = props.listType === ListType.icon;

  const collisionDetectionStrategy = useCollisionDetectionStrategy({
    groupFolderMap,
    activeId: state.activeId,
    lastOverId,
  });

  React.useEffect(() => {
    sidebarStore.initGroupFolders();
  }, []);

  React.useEffect(() => {
    if (props.groups.length !== totalGroups) {
      return;
    }
    const { groupFolders, groupBelongsToFolderMap, DEFAULT_FOLDER_UUID, defaultGroupFolder } = sidebarStore;
    if (props.groups.length > 0) {
      const hangingItems = [];
      for (const group of props.groups) {
        if (!groupBelongsToFolderMap[group.group_id]) {
          hangingItems.push(group.group_id);
        }
      }
      if (defaultGroupFolder) {
        defaultGroupFolder.items = [
          ...hangingItems,
          ...defaultGroupFolder.items,
        ];
        sidebarStore.setGroupFolders(groupFolders);
      } else {
        sidebarStore.unshiftGroupFolder({
          id: DEFAULT_FOLDER_UUID,
          name: lang.default,
          items: hangingItems,
          expand: true,
        });
      }
    }
  }, [props.groups.length, totalGroups]);

  React.useEffect(() => {
    if (props.groups.length !== totalGroups) {
      return;
    }
    if (props.groups.length > 0 || Math.abs(prevGroupLength - props.groups.length) === 1) {
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
  }, [props.groups.length, prevGroupLength, totalGroups]);

  const findFolder = (id: string) => groupFolderMap[id] || groupBelongsToFolderMap[id];

  if (props.highlight) {
    return (
      <div className={classNames({
        'grid grid-cols-3 gap-x-3 gap-y-4 py-5 px-[11px]': isHorizontal,
      })}
      >
        {props.groups.map((group) => (
          <div key={group.group_id}>
            <GroupItem
              group={group}
              highlight={props.highlight || ''}
              listType={props.listType}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={({ active }) => {
          state.activeId = ((active as any).id);
          if (groupBelongsToFolderMap[state.activeId]) {
            const activeIndex = groupFolders.indexOf(groupBelongsToFolderMap[state.activeId]);
            for (const [index, folder] of groupFolders.entries()) {
              if (index > activeIndex) {
                folder.expand = true;
              }
            }
          }
        }}
        onDragOver={({ active, over }) => {
          const overId = over?.id;

          if (!overId || groupFolderMap[active.id]) {
            return;
          }

          const overFolder = findFolder(overId);
          const activeFolder = findFolder(active.id);

          if (!overFolder || !activeFolder) {
            return;
          }

          if (activeFolder !== overFolder) {
            const activeItems = activeFolder.items;
            const overItems = overFolder.items;
            const overIndex = overItems.indexOf(overId);
            const activeIndex = activeItems.indexOf(active.id);

            let newIndex: number;

            if (groupFolderMap[overId]) {
              newIndex = overItems.length + 1;
            } else {
              const isBelowOverItem = over
              && active.rect.current.translated
              && active.rect.current.translated.top
                > over.rect.top + over.rect.height;
              const modifier = isBelowOverItem ? 1 : 0;
              newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            const activeFolderItems = activeFolder.items;
            activeFolder.items = activeFolderItems.filter(
              (item: any) => item !== active.id,
            );
            overFolder.items = [
              ...overFolder.items.slice(0, newIndex),
              activeFolderItems[activeIndex],
              ...overFolder.items.slice(
                newIndex,
                overFolder.items.length,
              ),
            ];
            sidebarStore.setGroupFolders(groupFolders);
          }
        }}
        onDragEnd={({ active, over }: any) => {
          if (groupFolderMap[active.id] && over?.id) {
            const activeIndex = groupFolders.indexOf(groupFolderMap[active.id]);
            const overIndex = groupFolders.indexOf(groupFolderMap[over.id]);
            sidebarStore.setGroupFolders(arrayMove(
              groupFolders,
              activeIndex,
              overIndex,
            ));
            return;
          }

          const activeFolder = findFolder(active.id);

          if (!activeFolder) {
            state.activeId = '';
            return;
          }

          const overId = over?.id;

          if (!overId) {
            state.activeId = '';
            return;
          }

          const overFolder = findFolder(overId);

          if (overFolder && activeFolder === overFolder) {
            const activeIndex = activeFolder.items.indexOf(active.id);
            const overIndex = overFolder.items.indexOf(overId);

            if (activeIndex !== overIndex) {
              overFolder.items = arrayMove(
                overFolder.items,
                activeIndex,
                overIndex,
              );
              sidebarStore.setGroupFolders(groupFolders);
            }
          }

          state.activeId = '';
        }}
      >
        <SortableContext items={groupFolders} strategy={verticalListSortingStrategy}>
          <div className="overflow-hidden">
            {groupFolders.map((groupFolder) => (
              <DroppableContainer
                key={groupFolder.id}
                id={groupFolder.id}
                items={groupFolder.items}
                groupFolder={groupFolder}
                isHorizontal={isHorizontal}
                highlight={groupBelongsToFolderMap[state.activeId] && groupBelongsToFolderMap[state.activeId].id === groupFolder.id}
              >
                <SortableContext items={groupFolder.items} strategy={rectSortingStrategy}>
                  {groupFolder.items.filter((groupId) => !!groupMap[groupId]).map((groupId) => (<SortableItem
                    key={groupId}
                    id={groupId}
                    group={groupMap[groupId]}
                    activeId={state.activeId}
                    {...props}
                  />))}
                </SortableContext>
              </DroppableContainer>
            ))}
          </div>
        </SortableContext>
      </DndContext>
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

const DroppableContainer = observer(({
  groupFolder,
  children,
  id,
  items,
  style,
  isHorizontal,
  highlight,
}: ContainerProps & {
  id: string
  items: string[]
  style?: React.CSSProperties
}) => {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transition,
    transform,
  } = useSortable({
    id,
    data: {
      type: 'container',
      items,
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        transition,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : undefined,
      }}
    >
      <div {...attributes} {...listeners}>
        <Folder
          groupFolder={groupFolder}
          highlight={highlight}
        />
      </div>
      {groupFolder.expand && groupFolder.items.length > 0 && (
        <div className={classNames({
          'grid grid-cols-3 gap-x-3 gap-y-4 py-5 px-[11px]': isHorizontal,
        }, 'overflow-hidden')}
        >
          {children}
        </div>
      )}
    </div>
  );
});

const SortableItem = observer((props: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id, disabled: sortableState.state.disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      style={style}
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      className={classNames({
        'relative z-50 bg-white': props.activeId === props.group.group_id,
      })}
    >
      <GroupItem
        group={props.group}
        highlight={props.highlight || ''}
        listType={props.listType}
      />
    </div>
  );
});

interface IFolderProps {
  groupFolder: IGroupFolder
  highlight: boolean
}

const Folder = observer((props: IFolderProps) => {
  const { latestStatusStore, sidebarStore, confirmDialogStore } = useStore();
  const { DEFAULT_FOLDER_UUID } = sidebarStore;
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
  const showNotificationBadge = !showUnreadCount && !folder.expand && notificationCount > 0;
  const isDefaultFolder = folder.id === DEFAULT_FOLDER_UUID;

  const update = (id: string, name: string) => {
    sidebarStore.updateGroupFolder(id, {
      ...folder,
      name,
    });
  };

  const remove = (id: string) => {
    if (folder.name) {
      confirmDialogStore.show({
        content: '确定删除分组吗？',
        okText: lang.yes,
        ok: () => {
          sidebarStore.groupFolderMap[DEFAULT_FOLDER_UUID].items.push(...folder.items);
          sidebarStore.removeGroupFolder(id);
          confirmDialogStore.hide();
        },
      });
    } else {
      sidebarStore.removeGroupFolder(id);
    }
  };

  const toggleExpand = (id: string) => {
    sidebarStore.updateGroupFolder(id, {
      ...folder,
      expand: !folder.expand,
    });
  };

  return (
    <div>
      <div
        className={classNames({
          'bg-blue-400 text-white': props.highlight,
          'bg-gray-f2 text-gray-88': !props.highlight,
        }, 'flex items-center pl-[2px] pr-2 h-9 cursor-pointer group')}
      >
        {!showInput && (
          <div className="text-22 mr-1 opacity-50" onClick={() => toggleExpand(folder.id)}>
            {folder.expand ? <AiOutlineCaretDown className="transform scale-x-75" /> : <AiOutlineCaretRight className="transform scale-y-75" />}
          </div>
        )}
        {!showInput && (
          <div
            className="flex-1 flex items-center justify-between"
            onClick={() => toggleExpand(folder.id)}
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
                    remove(folder.id);
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
                  update(folder.id, name);
                }
                state.name = '';
                state.creating = false;
                state.editing = false;
              }
            }}
            onBlur={() => {
              const name = state.name.trim();
              if (name) {
                update(folder.id, name);
              } else if (state.creating) {
                remove(folder.id);
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
    </div>
  );
});
