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

Log.setup();

export default () => (
  <ThemeRoot>
    <StoreProvider>
      <div>
        <Entry />
        <SnackBar />
        <ConfirmDialog />
        <PageLoading />

        {isProduction && <Updater />}
      </div>
    </StoreProvider>
  </ThemeRoot>
);
