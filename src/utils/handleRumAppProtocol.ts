import { Event, ipcRenderer } from 'electron';
import { parse as parseQuery } from 'query-string';
import { parse as parseUri } from 'uri-js';
import { joinGroup } from 'standaloneModals/joinGroup';

const actions: Record<string, (v: unknown) => unknown> = {
  '/join-group': (params: any) => {
    const seed = params.seed;
    if (!seed) {
      return;
    }
    try {
      JSON.parse(seed);
    } catch (e) {
      return;
    }
    joinGroup(seed);
  },
};

export const handleRumAppProtocol = () => {
  if (!process.env.IS_ELECTRON) {
    return;
  }
  const handler = (_e: Event, a: any) => {
    console.log(a);
    try {
      const uri = parseUri(a);
      const pathName = uri.path?.replace(/\/$/, '');
      if (!pathName) { return; }
      const query = uri.query ? parseQuery(uri.query) : null;
      actions[pathName]?.(query);
    } catch (e) {}
  };
  ipcRenderer.on('rum-app', handler);
  return () => {
    ipcRenderer.off('rum-app', handler);
  };
};
