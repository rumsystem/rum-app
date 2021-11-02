import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { StoreProvider } from 'store';

import Sidebar from 'layouts/Sidebar';
import Preload from 'layouts/Preload';

import Account from 'pages/Account';
import Assets from 'pages/Assets';
import Producer from 'pages/Producer';
import Vote from 'pages/Vote';
import Exchange from 'pages/Exchange';
import Transaction from 'pages/Transaction';

import AuthModal from 'components/AuthModal';
import VerificationModal from 'components/VerificationModal';
import SnackBar from 'components/SnackBar';
import ConfirmDialog from 'components/ConfirmDialog';

export default () => {
  return (
    <StoreProvider>
      <Router>
        <div>
          <div className="flex">
            <Preload />
            <Sidebar />
            <div className="flex-1">
              <Switch>
                <Route path="/account" component={Account} />
                <Route path="/assets" component={Assets} />
                <Route path="/producer" component={Producer} />
                <Route path="/vote" component={Vote} />
                <Route path="/exchange" component={Exchange} />
                <Route path="/transaction" component={Transaction} />
              </Switch>
            </div>
          </div>
          <AuthModal />
          <VerificationModal />
          <SnackBar />
          <ConfirmDialog />
        </div>
      </Router>
    </StoreProvider>
  );
};
