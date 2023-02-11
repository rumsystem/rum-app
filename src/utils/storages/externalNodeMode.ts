const ENABLED_EXTERNAL_NODE_MODE = 'ENABLED_EXTERNAL_NODE_MODE';

export default {
  enable() {
    localStorage.setItem(ENABLED_EXTERNAL_NODE_MODE, 'true');
  },

  disable() {
    localStorage.removeItem(ENABLED_EXTERNAL_NODE_MODE);
  },

  enabled() {
    return localStorage.getItem(ENABLED_EXTERNAL_NODE_MODE);
  },
};
