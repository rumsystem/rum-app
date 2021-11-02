import React from 'react';
import { render } from 'react-dom';
import App from './App';
import { initQuorum } from './utils/quorum/request';
import './App.global.css';
import './App.global.scss';

render(<App />, document.getElementById('root'));
initQuorum()
