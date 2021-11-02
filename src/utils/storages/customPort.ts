const STORAGE_CUSTOM_PORT_ENABLED = 'CUSTOM_PORT_ENABLED';

export default {
  enable() {
    localStorage.setItem(STORAGE_CUSTOM_PORT_ENABLED, 'true');
  },

  disable() {
    localStorage.removeItem(STORAGE_CUSTOM_PORT_ENABLED);
  },

  enabled() {
    return localStorage.getItem(STORAGE_CUSTOM_PORT_ENABLED);
  },
};
