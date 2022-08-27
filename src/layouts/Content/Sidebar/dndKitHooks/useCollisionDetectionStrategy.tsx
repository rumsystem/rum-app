import React from 'react';
import {
  closestCenter,
  CollisionDetection,
  rectIntersection,
  getFirstCollision,
  pointerWithin,
} from '@dnd-kit/core';

interface IProps {
  groupFolderMap: any
  activeId: any
  lastOverId: any
}

export default ({
  groupFolderMap,
  activeId,
  lastOverId,
}: IProps) => React.useCallback(
  (args) => {
    if (activeId && groupFolderMap[activeId]) {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (container) => groupFolderMap[container.id],
        ),
      });
    }

    // Start by finding any intersecting droppable
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
    let overId = getFirstCollision(intersections, 'id');

    if (overId) {
      if (groupFolderMap[overId]) {
        const containerItems = groupFolderMap[overId].items;

        if (containerItems.length > 0) {
          // Return the closest droppable within that container
          overId = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (container) =>
                container.id !== overId
                    && containerItems.includes(container.id),
            ),
          })[0]?.id;
        }
      }

      lastOverId.current = overId;

      return [{ id: overId }];
    }

    // If no droppable is matched, return the last match
    return lastOverId.current ? [{ id: lastOverId.current }] : [];
  },
  [groupFolderMap, activeId, lastOverId],
) as CollisionDetection;
