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
import css from './styles/tailwind-base.sass?inline';
import './styles/App.global.scss';
import './styles/rendered-markdown.sass';

Log.setup();
ipcRenderer.setMaxListeners(20);

configure({
  enforceActions: 'never',
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
});

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
initQuorum();

const style = document.createElement('style');
style.innerHTML = css;
const commentNode = Array.from(document.head.childNodes)
  .filter((v) => v.nodeType === 8)
  .find((v) => v.textContent && v.textContent.includes('preflight-injection-point'))!;

document.head.insertBefore(style, commentNode);
