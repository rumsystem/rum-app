import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import { useStore } from 'store';
import { BiChevronRight } from 'react-icons/bi';
import { MdInfo } from 'react-icons/md';
import Button from 'components/Button';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import { remote } from 'electron';
import fs from 'fs';
import util from 'util';
import { sleep, PrsAtm } from 'utils';
import Tooltip from '@material-ui/core/Tooltip';
import { MdDone } from 'react-icons/md';

const pReadFile = util.promisify(fs.readFile);

export default observer(() => {
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    keystore: null as any,
    password: '',
    loading: false,
  }));

  return (
    <div className="p-8 px-12">
      <div className="w-65">
        <div className="text-gray-700 font-bold text-18 text-center">
          导入账号
        </div>
        <div className="mt-6 pt-2" />
        <Tooltip
          placement="top"
          title="选择保存在你电脑上的 keystore.json"
          arrow
        >
          <div>
            <Button
              fullWidth
              color={state.keystore ? 'green' : 'primary'}
              onClick={async () => {
                try {
                  const file = await remote.dialog.showOpenDialog({
                    filters: [{ name: 'json', extensions: ['json'] }],
                    properties: ['openFile'],
                  });
                  if (!file.canceled && file.filePaths) {
                    const keystoreString = await pReadFile(
                      file.filePaths[0].toString(),
                      'utf8'
                    );
                    state.keystore = JSON.parse(keystoreString);
                  }
                } catch (err) {
                  console.log(err);
                }
              }}
            >
              {state.keystore ? '私钥文件已选中' : '点击选择私钥文件'}
              {state.keystore && <MdDone className="ml-1 text-18" />}
            </Button>
          </div>
        </Tooltip>
        <div className="mt-3">
          <TextField
            className="w-full"
            type="password"
            placeholder="密码"
            size="small"
            value={state.password}
            onChange={(e) => {
              state.password = e.target.value;
            }}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="mt-6">
          <Button fullWidth isDoing={state.loading} color="gray">
            确定
          </Button>
        </div>
      </div>
    </div>
  );
});
