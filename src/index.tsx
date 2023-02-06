import React from 'react';
import { ipcRenderer } from 'electron';
import { createRoot } from 'react-dom/client';
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

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
initQuorum();
