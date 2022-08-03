import React from 'react';
import { StoreProvider } from 'store';

import { isProduction, isStaging } from 'utils/env';
import { ThemeRoot } from 'utils/theme';
import { preloadAvatars } from 'utils/avatars';
import { handleRumAppProtocol } from 'utils/handleRumAppProtocol';

import SnackBar from 'components/SnackBar';
import NotificationSlide from 'components/NotificationSlide';
import ConfirmDialog from 'components/ConfirmDialog';
import PageLoading from 'components/PageLoading';
import PreviewVersion from 'components/PreviewVersion';

import Updater from '../Updater';
import MyNodeInfoModal from './modals/MyNodeInfoModal';
import App from './App';


export default () => {
  React.useEffect(() => {
    preloadAvatars();
    return handleRumAppProtocol();
  }, []);

  return (
    <ThemeRoot>
      <StoreProvider>
        <App />

        <PageLoading />
        {isProduction && !isStaging && <Updater />}
        {isStaging && <PreviewVersion />}
        <ConfirmDialog />
        <SnackBar />
        <NotificationSlide />
        <MyNodeInfoModal />
      </StoreProvider>
    </ThemeRoot>
  );
};
