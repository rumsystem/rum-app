export const isDevelopment = process.env.NODE_ENV === 'development';

export const isProduction = !isDevelopment;

export const isWindow = window.navigator.userAgent.includes('Windows NT');
