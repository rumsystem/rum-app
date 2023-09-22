import { clipboard } from 'electron';

export const setClipboard = async (text: string) => {
  if (process.env.IS_ELECTRON) {
    clipboard.writeText(text);
    return;
  }

  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  if (window.navigator.clipboard?.writeText) {
    try {
      await window.navigator.clipboard.writeText(text);
      return;
    } catch (e) {}
  }

  const pre = document.createElement('pre');
  pre.textContent = text;
  document.body.appendChild(pre);
  const range = document.createRange();
  range.selectNode(pre);
  selection.empty();
  selection.addRange(range);
  document.execCommand('Copy');
  document.body.removeChild(pre);
};
