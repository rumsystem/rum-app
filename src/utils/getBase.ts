export default () => {
  const { apiConfig } = (window as any).store.nodeStore;
  const host = apiConfig.host || '127.0.0.1';
  return (host.includes('https') ? host : `http://${host}`) + `:${apiConfig.port}`;
};
