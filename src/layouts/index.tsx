import React from 'react';
import { StoreProvider } from 'store';

import { isProduction } from 'utils/env';
import { ThemeRoot } from 'utils/theme';

import SnackBar from 'components/SnackBar';
import ConfirmDialog from 'components/ConfirmDialog';
import PageLoading from 'components/PageLoading';

import Updater from '../Updater';
import MyNodeInfoModal from './modals/MyNodeInfoModal';
import GroupShareModal from './modals/GroupShareModal';
import { CreateGroup } from './modals/CreateGroup';
import { JoinGroup } from './modals/JoinGroup';
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

      <CreateGroup />
      <JoinGroup />
    </StoreProvider>
  </ThemeRoot>
);
