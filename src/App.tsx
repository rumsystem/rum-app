import React from 'react';
import { StoreProvider } from 'store';

import Entry from 'entry';

import Updater from './Updater';

import SnackBar from 'components/SnackBar';
import ConfirmDialog from 'components/ConfirmDialog';
import PageLoading from 'components/PageLoading';

import Log from 'utils/log';
import { isProduction } from 'utils/env';
import { ThemeRoot } from 'utils/theme';
import { TitleBar } from 'layouts/TitleBar';
import MyNodeInfoModal from 'layouts/modals/MyNodeInfoModal';
import GroupShareModal from 'layouts/modals/GroupShareModal';

Log.setup();

export default () => (
  <ThemeRoot>
    <StoreProvider>
      <div className="flex flex-col h-screen w-screen">
        <TitleBar className="flex-none items-stretch" />
        <div className="flex-1 h-0">
          <Entry />
          <SnackBar />
          <ConfirmDialog />
          <PageLoading />

          <MyNodeInfoModal />
          <GroupShareModal />

          {isProduction && <Updater />}
        </div>
      </div>
    </StoreProvider>
  </ThemeRoot>
);
