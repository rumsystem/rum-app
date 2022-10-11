export default () => {
  const { nodeStore } = (window as any).store;
  if (nodeStore.mode === 'EXTERNAL') {
    return nodeStore.apiConfig.origin;
  }
  return `http://127.0.0.1:${nodeStore.port}`;
};
