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
import { isProduction } from 'utils/env';
import { ThemeRoot } from 'utils/theme';

Log.setup();

export default () => {
  return (
    <ThemeRoot>
      <StoreProvider>
        <Router>
          <div>
            <div className="flex">
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
    </ThemeRoot>
  );
};
