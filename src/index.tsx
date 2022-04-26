import React from 'react';
import { ipcRenderer } from 'electron';
import { render } from 'react-dom';
import { configure } from 'mobx';
import App from './App';
import { initQuorum } from 'utils/quorum/request';
import './tailwind.sass';
import './App.global.scss';

ipcRenderer.setMaxListeners(20);

configure({
  enforceActions: 'never',
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
});

render(<App />, document.getElementById('root'));
initQuorum();
