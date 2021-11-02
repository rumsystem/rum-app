import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { StoreProvider } from 'store';

import Sidebar from 'layouts/Sidebar';
import Preload from 'layouts/Preload';
import Updater from 'layouts/Updater';

import Dashboard from 'pages/Dashboard';
import Producer from 'pages/Producer';
import Swap from 'pages/Swap';
import ChainData from 'pages/ChainData';

import AuthModal from 'components/AuthModal';
import VerificationModal from 'components/VerificationModal';
import SnackBar from 'components/SnackBar';
import ConfirmDialog from 'components/ConfirmDialog';
import PaymentModal from 'components/PaymentModal';
import QuickPaymentModal from 'components/QuickPaymentModal';
import PageLoading from 'components/PageLoading';

import { Log, isProduction } from 'utils';

Log.setup();

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
            <Sidebar />
            <div className="flex-1">
              <Switch>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/producer" component={Producer} />
                <Route path="/swap" component={Swap} />
                <Route path="/chaindata" component={ChainData} />
              </Switch>
            </div>
          </div>
          <AuthModal />
          <VerificationModal />
          <SnackBar />
          <ConfirmDialog />
          <PaymentModal />
          <QuickPaymentModal />
          <PageLoading />

          {isProduction && <Updater />}
        </div>
      </Router>
    </StoreProvider>
  );
};
