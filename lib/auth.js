define(function() {

    var defaults = {
        apiAuthenticateUrl: 'https://api.mendeley.com/oauth/authorize',
        accessTokenCookieName: 'accessToken',
        scope: 'all'
    };

    var defaultsImplicitFlow = {
        clientId: false,
        redirectUrl: false
    };

    var defaultsAuthCodeFlow = {
        apiAuthenticateUrl: '/login',
        refreshAccessTokenUrl: false
    };

    var settings = {};

    return {
        implicitGrantFlow: implicitGrantFlow,
        authCodeFlow: authCodeFlow
    }

    function implicitGrantFlow(options) {

        settings = $.extend({}, defaults, defaultsImplicitFlow, options || {});

        if (!settings.clientId) {
            console.error('You must provide a clientId for implicit grant flow');
            return false;
        }

        // OAuth redirect url defaults to current url
        if (!settings.redirectUrl) {
            var loc = window.location;
            settings.redirectUrl = loc.protocol + '//' + loc.host + loc.pathname;
        }

        settings.apiAuthenticateUrl = settings.apiAuthenticateUrl +
            '?client_id=' + settings.clientId +
            '&redirect_uri=' + settings.redirectUrl +
            '&scope=' + settings.scope +
            '&response_type=token';

        if (!getAccessTokenCookieOrUrl()) {
            authenticate();
        }

        return {
            authenticate: authenticate,
            getToken: getAccessTokenCookieOrUrl,
            refreshToken: noop()
        }
    }

    function authCodeFlow(options) {

        settings = $.extend({}, defaults, defaultsImplicitFlow, options || {});

        if (!settings.apiAuthenticateUrl) {
            console.error('You must provide an apiAuthenticateUrl for auth code flow');
            return false;
        }

        if (!getAccessTokenCookie()) {
            authenticate();
        }

        return {
            authenticate: authenticate,
            getToken: getAccessTokenCookie,
            refreshToken: refreshAccessTokenCookie
        }
    }

    function noop() {
        return function() { return false };
    }

    function authenticate() {
        clearAccessTokenCookie();
        window.location = settings.apiAuthenticateUrl;
    }

    function getAccessTokenCookieOrUrl() {
        var location = window.location,
            hash = location.hash ? location.hash.split('=')[1] : '',
            cookie = getAccessTokenCookie();

        if (hash && !cookie) {
            setAccessTokenCookie(hash);
            return hash;
        }
        if (!hash && cookie) {
            return cookie;
        }
        if (hash && cookie) {
            if (hash !== cookie) {
                setAccessTokenCookie(hash);
                return hash;
            }
            return cookie;
        }

        return '';
    }

    function getAccessTokenCookie() {
        var name = settings.accessTokenCookieName + '=',
            ca = document.cookie.split(';');

        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];

            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }

            if (c.indexOf(name) !== -1) {
                return c.substring(name.length, c.length);
            }
        }

        return '';
    }

    function setAccessTokenCookie(accessToken, expireHours) {
        var d = new Date();
        d.setTime(d.getTime() + (expireHours*60*60*1000));
        var expires = 'expires=' + d.toUTCString();
        document.cookie = settings.accessTokenCookieName + '=' + accessToken + '; ' + expires;
    }

    function clearAccessTokenCookie() {
        setAccessTokenCookie('', -1);
    }

    function refreshAccessTokenCookie() {
        if (settings.refreshAccessTokenUrl) {
            return $.get(this.settings.refreshAccessTokenUrl);
        }

        return false;
    }
});

