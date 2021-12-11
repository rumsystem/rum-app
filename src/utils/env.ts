import { app } from '@electron/remote';

export const isDevelopment = process.env.NODE_ENV === 'development';

export const isProduction = !isDevelopment;

export const isStaging = process.env.BUILD_ENV === 'staging';

export const isWindow = window.navigator.userAgent.includes('Windows NT');

export const assetsBasePath = isProduction
  ? `file://${process.resourcesPath.replaceAll('\\', '/')}/assets`
  : `file://${app.getAppPath().replaceAll('\\', '/')}/assets`;
