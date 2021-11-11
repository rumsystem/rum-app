import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action } from 'mobx';
import { FormControl, Select, MenuItem } from '@material-ui/core';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider } from 'store';
import { i18n } from 'store/i18n';

export const languageSelect = async () => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <LanguageSelect
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
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
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 p-8 pb-4 flex flex-col items-center">
        <div className="text-18 font-bold text-gray-700">切换语言</div>
        <FormControl
          className="w-52 mt-10"
          size="small"
          variant="outlined"
        >
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={state.lang}
            onChange={action((e) => { state.lang = e.target.value as string; })}
          >
            <MenuItem value="cn">中文</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </Select>
        </FormControl>

        <Button
          className="mt-12"
          onClick={submit}
        >
          确定
        </Button>
      </div>
    </Dialog>
  );
});
