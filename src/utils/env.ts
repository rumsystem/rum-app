import { app } from '@electron/remote';
import { join } from 'path';

export const isDevelopment = process.env.NODE_ENV === 'development';

export const isProduction = !isDevelopment;

export const isStaging = process.env.BUILD_ENV === 'staging';

export const isWindow = window.navigator.userAgent.includes('Windows NT');

/** @deprecated use import svg insted */
export const assetsBasePath = process.env.IS_ELECTRON
  ? isProduction
    ? `file://${process.resourcesPath.replaceAll('\\', '/')}/assets`
    : `file://${app.getAppPath().replaceAll('\\', '/')}/assets`
  : '';

/** @deprecated use import svg insted */
export const assetsBasePathFileSystem = process.env.IS_ELECTRON
  ? isProduction
    ? join(process.resourcesPath, 'assets')
    : join(app.getAppPath(), 'assets')
  : '';
