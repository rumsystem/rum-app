import React from 'react';
import Dexie from 'dexie';
import { render } from 'react-dom';
import { configure } from 'mobx';
import App from './App';
import { initQuorum } from './utils/quorum/request';
import './App.global.css';
import './App.global.scss';

(Dexie as any).debug = false;

configure({
  enforceActions: 'never',
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
});

render(<App />, document.getElementById('root'));
initQuorum();
