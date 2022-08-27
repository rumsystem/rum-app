import { i18n } from 'store/i18n';
import * as cn from './cn';
import * as en from './en';

export const lang = i18n.createLangLoader({
  cn,
  en,
});
