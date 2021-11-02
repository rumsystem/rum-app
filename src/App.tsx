import React from 'react';
import { StoreProvider } from 'store';

import Preload from 'layouts/Preload';
import Updater from 'layouts/Updater';

import Entry from 'entry';

import SnackBar from 'components/SnackBar';
import ConfirmDialog from 'components/ConfirmDialog';
import PageLoading from 'components/PageLoading';
import useSetupMenuEvent from 'hooks/useSetupToggleMode';

import Log from 'utils/log';
import { isProduction } from 'utils/env';
import { ThemeRoot } from 'utils/theme';

Log.setup();

export default () => (
  <ThemeRoot>
    <StoreProvider>
      <div>
        <Preload />
        <Entry />
        <SnackBar />
        <ConfirmDialog />
        <PageLoading />

        {isProduction && <Updater />}
      </div>

      <MenuEvents />
    </StoreProvider>
  </ThemeRoot>
);

const MenuEvents = () => {
  useSetupMenuEvent();

  return null;
};
