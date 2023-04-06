import { clipboard } from 'electron';

export const setClipboard = (text: string) => {
  clipboard.writeText(text);
};
