import { ipcRenderer } from 'electron';

export const loadInspect = () => {
  const keys = new Set<string>();

  const handleKeyDown = (e: KeyboardEvent) => {
    keys.add(e.key.toLowerCase());
    check();
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    keys.delete(e.key.toLowerCase());
  };
  const handleBlur = () => {
    keys.clear();
  };
  const check = () => {
    const conditions = [
      keys.size === 3,
      keys.has('control') || keys.has('command'),
      keys.has('shift'),
      keys.has('c'),
    ];
    if (conditions.every(Boolean)) {
      ipcRenderer.send('inspect-picker');
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
  };
};
