const ICON = {
    dark: '/static/icon-dark.png',
    light: '/static/icon-light.png'
};

window.TrelloPowerUp.initialize({
    'card-buttons': (t: any) => {
        return [{
            icon: ICON.dark,
            text: 'Card Factory',
            callback: (tc: any) => {
                return tc.popup({
                    title: 'Card Factory',
                    url: './connector.html',
                    height: 200,
                });
            }
        }];
    }
});
