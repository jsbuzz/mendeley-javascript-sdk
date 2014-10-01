define(function() {

    return {
        mockImplicitGrantFlow: mockImplicitGrantFlow,
        mockAuthCodeFlow: mockAuthCodeFlow
    }

    function mockImplicitGrantFlow() {
        var fakeToken = 'auth';

        return {
            getToken: function() { return fakeToken },
            authenticate: function() { return false; },
            refreshToken: function () { return false; }
        }
    }

    function mockAuthCodeFlow() {
        var fakeToken = 'auth';

        return {
            getToken: function() { return fakeToken },
            authenticate: function() { return false; },
            refreshToken: function() {
                fakeToken = 'auth-refreshed';
                return $.Deferred().resolve();
            }
        }
    }
});
