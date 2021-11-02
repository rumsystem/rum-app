import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { StoreProvider } from 'store';

import Preload from 'layouts/Preload';
import Updater from 'layouts/Updater';

import Group from 'pages/Group';

import SnackBar from 'components/SnackBar';
import ConfirmDialog from 'components/ConfirmDialog';
import PageLoading from 'components/PageLoading';

import Log from 'utils/log';
import { initMenuEventListener } from 'utils/menuEvent';
import { isProduction } from 'utils/env';

Log.setup();
initMenuEventListener();

export default () => {
  return (
    <StoreProvider>
      <Router>
        <div>
          <div
            className="flex"
            style={{
              minWidth: 1270,
            }}
          >
            <Preload />
            <div className="flex-1">
              <Switch>
                <Route path="" component={Group} />
              </Switch>
            </div>
          </div>

          <SnackBar />
          <ConfirmDialog />
          <PageLoading />

          {isProduction && <Updater />}
        </div>
      </Router>
    </StoreProvider>
  );
};
