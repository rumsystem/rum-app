import { action, observable } from 'mobx';

const state = observable({
  disabled: false,
});

const disableSortable = action(() => {
  state.disabled = true;
});
const enableSortable = action(() => {
  state.disabled = false;
});


export const sortableState = {
  state,
  disableSortable,
  enableSortable,
};
