import React from 'react';
import { createRoot } from 'react-dom/client';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import { FormControl, Select, MenuItem } from '@mui/material';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider } from 'store';
import { i18n, AllLanguages } from 'store/i18n';
import { lang } from 'utils/lang';

export const languageSelect = async () => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
    <ThemeRoot>
      <StoreProvider>
        <LanguageSelect
          rs={() => {
            rs();
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
});

interface Props {
  rs: () => unknown
}

const LanguageSelect = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    lang: i18n.state.lang,
  }));

  const submit = () => {
    i18n.switchLang(state.lang);
    handleClose();
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  return (
    <Dialog
      open={state.open}
      onClose={handleClose}
      transitionDuration={300}
    >
      <div className="bg-white rounded-0 p-8 pb-4 flex flex-col items-center">
        <div className="text-18 font-bold text-gray-700">{lang.switchLang}</div>
        <FormControl
          className="w-52 mt-10"
          size="small"
          variant="outlined"
        >
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={state.lang}
            onChange={(e) => runInAction(() => {
              state.lang = e.target.value as AllLanguages;
            })}
          >
            <MenuItem value="cn">中文</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </Select>
        </FormControl>

        <Button
          className="mt-12"
          onClick={submit}
        >
          {lang.yes}
        </Button>
      </div>
    </Dialog>
  );
});
