export default () =>
  `http://${(window as any).store.nodeStore.apiConfig.host || '127.0.0.1'}:${
    (window as any).store.nodeStore.apiConfig.port
  }`;
