import { action, observable } from 'mobx';

const STORAGE_KEY = 'I18N_CURRENT_LANG';

const allLang = ['cn', 'en'];

const state = observable({
  lang: 'cn',
});

type LangData<T> = Record<string, { content: T }>;

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

const switchLang = action((lang: string) => {
  state.lang = lang;
});

const init = action(() => {
  let value = localStorage.getItem(STORAGE_KEY) || 'cn';
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
