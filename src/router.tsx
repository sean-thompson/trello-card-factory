import React from 'react';
import {BrowserRouter as Router, Route} from 'react-router-dom';

const ConfigPopup = React.lazy(() => import('./components/ConfigPopup'));

const t = window.TrelloPowerUp.iframe({
    appKey: process.env.POWERUP_APP_KEY,
    appName: process.env.POWERUP_NAME
});

function PowerupRouter() {
    return (
        <React.Suspense fallback={<div style={{ margin: '6px' }}>Loading...</div>}>
            <Router basename={process.env.CONTEXT_PATH || undefined}>
                <Route path="/">
                    <ConfigPopup t={t} />
                </Route>
            </Router>
        </React.Suspense>
    );
}

export default PowerupRouter;
