import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import fs from 'fs-extra';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { clipboard, dialog } from '@electron/remote';
import { IconButton, OutlinedInput } from '@material-ui/core';
import { IoMdCopy } from 'react-icons/io';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { lang } from 'utils/lang';
import KeyApi from 'apis/key';

export const exportKey = async () => new Promise<void>((rs) => {
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
          <ExportKey
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

interface Props { rs: () => unknown }

const ExportKey = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    backup: '',
  }));
  const {
    snackbarStore,
  } = useStore();

  const handleDownloadSeed = async () => {
    try {
      const file = await dialog.showSaveDialog({
        defaultPath: 'backup.json',
      });
      if (!file.canceled && file.filePath) {
        await fs.writeFile(
          file.filePath.toString(),
          state.backup,
        );
        await sleep(400);
        handleClose();
        snackbarStore.show({
          message: lang.downloadedBackup,
          duration: 2500,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    clipboard.writeText(state.backup);
    snackbarStore.show({
      message: lang.copied,
    });
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  React.useEffect(action(() => {
    (async () => {
      try {
        const res = await KeyApi.backup();
        state.backup = JSON.stringify(res, null, 2);
      } catch (e) {
      }
    })();
  }), []);

  return (
    <Dialog
      open={state.open}
      maxWidth={false}
      onClose={handleClose}
      transitionDuration={300}
    >
      <div className="bg-white rounded-0 text-center py-10 px-12">
        <div className="text-18 font-medium text-gray-4a">
          {lang.exportKey}
        </div>
        <div className="px-3">
          <OutlinedInput
            className="mt-6 w-90 p-0"
            onFocus={(e) => e.target.select()}
            classes={{ input: 'p-4 text-gray-af focus:text-gray-70' }}
            value={state.backup}
            multiline
            minRows={6}
            maxRows={6}
            spellCheck={false}
            endAdornment={(
              <div className="self-stretch absolute right-0">
                <IconButton onClick={handleCopy}>
                  <IoMdCopy className="text-20" />
                </IconButton>
              </div>
            )}
          />
        </div>

        <div className="text-14 text-gray-9b mt-4">
          {lang.copyBackup}
        </div>

        <div className="mt-5">
          <Button onClick={handleDownloadSeed}>
            {lang.downloadBackup}
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
