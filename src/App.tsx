import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { StoreProvider } from 'store';

import Sidebar from 'layouts/Sidebar';
import Preload from 'layouts/Preload';

import Dashboard from 'pages/Dashboard';
import Producer from 'pages/Producer';
import Exchange from 'pages/Exchange';

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
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/producer" component={Producer} />
                <Route path="/exchange" component={Exchange} />
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
