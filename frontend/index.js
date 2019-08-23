import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';
import { createClient } from './apollo';

const apolloClient = createClient();
const element = React.createElement(App, { apolloClient });

ReactDOM.render(element, document.getElementById('main'));
