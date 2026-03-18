import React from 'react';
import * as ReactDOM from 'react-dom';
import AttachmentSection from './components/AttachmentSection';

const t = window.TrelloPowerUp.iframe({
    appKey: process.env.POWERUP_APP_KEY,
    appName: process.env.POWERUP_NAME
});

ReactDOM.render(
    <AttachmentSection t={t} />,
    document.getElementById('react-root')
);
