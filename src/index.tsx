import React from 'react';
import { ipcRenderer } from 'electron';
import { render } from 'react-dom';
import { configure } from 'mobx';
import App from './layouts';
import { initQuorum } from 'utils/quorum/request';
import Log from 'utils/log';
import './utils/highlightjs';
import 'easymde/dist/easymde.min.css';
import './styles/tailwind.sass';
import './styles/App.global.scss';
import './styles/rendered-markdown.sass';

Log.setup();
if (process.env.IS_ELECTRON) {
  ipcRenderer.setMaxListeners(20);
}

configure({
  enforceActions: 'never',
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
});

render(<App />, document.getElementById('root'));
initQuorum();
