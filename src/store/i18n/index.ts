import { action, observable } from 'mobx';

const STORAGE_KEY = 'I18N_CURRENT_LANG';

const allLang = ['cn', 'en'] as const;

export type AllLanguages = typeof allLang[number];
type LangData<T> = Record<AllLanguages, { content: T }>;

const state = observable({
  lang: 'cn' as AllLanguages,
});

const createLangLoader = <T>(langData: LangData<T>) => {
  const langState = new Proxy({}, {
    get(_target, prop, _receiver) {
      const data = langData[state.lang];
      if (!data) {
        throw new Error(`${state.lang} language resource for this component is not defined.`);
      }
      return data.content[prop as keyof T];
    },
  });

  return langState as T;
};

const switchLang = action((lang: AllLanguages) => {
  state.lang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
});

const init = action(() => {
  let value = (localStorage.getItem(STORAGE_KEY) || 'cn') as AllLanguages;
  if (!allLang.includes(value)) {
    value = 'cn';
  }
  state.lang = value;
});

init();

export const i18n = {
  state,
  createLangLoader,
  switchLang,
};
