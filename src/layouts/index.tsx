import React from 'react';
import { StoreProvider } from 'store';

import { isProduction } from 'utils/env';
import { ThemeRoot } from 'utils/theme';

import SnackBar from 'components/SnackBar';
import ConfirmDialog from 'components/ConfirmDialog';
import PageLoading from 'components/PageLoading';

import MyNodeInfoModal from 'layouts/modals/MyNodeInfoModal';
import GroupShareModal from 'layouts/modals/GroupShareModal';
import Updater from '../Updater';
import App from './App';


export default () => (
  <ThemeRoot>
    <StoreProvider>
      <App />

      <PageLoading />
      {isProduction && <Updater />}
      <ConfirmDialog />
      <SnackBar />
      <MyNodeInfoModal />
      <GroupShareModal />
    </StoreProvider>
  </ThemeRoot>
);
