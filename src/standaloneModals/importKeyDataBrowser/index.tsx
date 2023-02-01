import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import { MdDone } from 'react-icons/md';
import { Tooltip } from '@material-ui/core';

import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import KeyApi from 'apis/key';
import { lang } from 'utils/lang';
import { runLoading } from 'utils/runLoading';
import sleep from 'utils/sleep';

export const importKeyDataBrowser = async () => new Promise<void>((rs) => {
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
          <ImportKeyDataBrowser
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

const ImportKeyDataBrowser = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    loading: false,
    done: false,

    fileContent: '',
  }));
  const { snackbarStore } = useStore();

  const submit = () => {
    if (state.loading) {
      return;
    }
    runLoading(
      (l) => { state.loading = l; },
      async () => {
        try {
          const keys = JSON.parse(state.fileContent);

          for (const key of keys) {
            const res = await KeyApi.restoreKeyBrowser(key);
            console.log(res);
          }

          snackbarStore.show({
            message: lang.joined,
          });
          runInAction(() => {
            state.done = true;
          });
          await sleep(500);
          handleClose();
        } catch (e) {
          console.error(e);
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    );
  };

  const handleSelectFile = async () => {
    try {
      // TODO: remove any in ts 4.6
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'json file',
          accept: { 'text/json': ['.json'] },
        }],
      }).catch(() => [null]);
      if (!handle) {
        return;
      }

      const file = await handle.getFile();
      const content = await new Promise<string | null>((rs) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.addEventListener('load', () => {
          rs(reader.result as string);
        });
        reader.addEventListener('error', (e) => {
          console.error(e);
          rs(null);
        });
      });
      if (!content) {
        return;
      }
      state.fileContent = content;
    } catch (err) {
      console.error(err);
    }
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
      <div className="bg-white rounded-0 text-center p-8 pb-4">
        <div className="w-64">
          <div className="text-18 font-bold text-gray-700">{lang.importKey}</div>
          <div className="mt-4 pt-2" />
          <Tooltip
            disableHoverListener={!!state.fileContent}
            placement="top"
            title={lang.selectKeyBackupToImport}
            arrow
          >
            <div className="px-8 py-2 mt-1">
              <Button
                fullWidth
                color={state.fileContent ? 'green' : 'primary'}
                isDoing={state.loading}
                onClick={handleSelectFile}
              >
                {state.fileContent ? lang.selectedKeyBackupFile : lang.selectKeyBackupFile}
                {state.fileContent && <MdDone className="ml-1 text-15" />}
              </Button>
            </div>
          </Tooltip>
          <div className="mt-6 mb-4 pt-[2px]">
            <Button
              fullWidth
              disabled={!state.fileContent}
              isDoing={state.loading}
              isDone={state.done}
              onClick={submit}
            >
              {lang.yes}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
