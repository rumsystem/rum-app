import { shell } from 'electron';

const open = (blockNum: number) => {
  shell.openExternal(`https://press.one/blockchain/blocks/${blockNum}`);
};

export default {
  open,
};
