import { modalService } from '../modal';
import { Props } from './JoinGroup';

export const joinGroup = (seed?: Props['seed']) => {
  const item = modalService.createModal();
  item.addModal('joinGroup', {
    rs: () => setTimeout(item.destoryModal, 3000),
    seed,
  });
};
