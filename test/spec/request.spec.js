define(function(require) {

    'use strict';

    require('es5-shim');

    // Get a function to return promises in order
    function getMockPromises() {
        var responses = Array.prototype.slice.call(arguments);
        var calls = 0;
        return function() {
            return responses[calls++];
        };
    }

    describe('request', function() {

        var request = require('request');
        var mockAuth = require('../mocks/auth');

        it ('should have a request type property', function() {
            var myRequest = request.create({ type: 'GET' }, { authFlow: mockAuth.mockImplicitGrantFlow() });
            expect(myRequest.request.type).toBe('GET');
        });

        it ('should have allow setting the type to whatever you like', function() {
            var myRequest = request.create({ type: 'POST' }, { authFlow: mockAuth.mockImplicitGrantFlow() });
            expect(myRequest.request.type).toBe('POST');
        });

        describe('authentication', function() {

            it('should add optional accessToken to the Authorization header', function() {
                var myRequest = request.create({ type: 'GET' }, { authFlow: mockAuth.mockImplicitGrantFlow() });
                var fun = getMockPromises(
                    $.Deferred().resolve({}, 1, { status: 200 }).promise()
                );
                spyOn($, 'ajax').and.callFake(fun);

                myRequest.send();

                expect(myRequest.request.headers.Authorization).toEqual('Bearer auth');
            });
        });

        describe('authentication failures', function() {

            it('should try calling authFlow.refreshToken() if using authCodeFlow', function() {
                var mockAuthInterface = mockAuth.mockAuthCodeFlow();
                var myRequest = request.create({ type: 'GET' }, { authFlow: mockAuthInterface });
                var fun = getMockPromises(
                    $.Deferred().reject({ status: 401 }).promise(), // Auth failure
                    $.Deferred().resolve({}, 1, { status: 200 }).promise() // Original request success
                );
                var ajaxSpy = spyOn($, 'ajax').and.callFake(fun);
                var authRefreshSpy = spyOn(mockAuthInterface, 'refreshToken').and.callThrough();

                myRequest.send();

                expect(authRefreshSpy.calls.count()).toEqual(1);
                expect(ajaxSpy.calls.count()).toEqual(2);
                expect(ajaxSpy.calls.mostRecent().args[0].headers.Authorization).toEqual('Bearer auth-refreshed');
            });

            it('should fail and call authenticate if cannot refresh token', function(done) {
                var mockAuthInterface = mockAuth.mockAuthCodeFlow();
                var myRequest = request.create({ type: 'GET' }, { authFlow: mockAuthInterface });
                var fun = getMockPromises(
                    $.Deferred().reject({ status: 401 }).promise(), // Auth failure
                    $.Deferred().resolve({}, 1, { status: 200 }).promise() // Original request success
                );
                var ajaxSpy = spyOn($, 'ajax').and.callFake(fun);
                var authRefreshSpy = spyOn(mockAuthInterface, 'refreshToken').and.returnValue($.Deferred().reject());
                var authAuthenticateSpy = spyOn(mockAuthInterface, 'authenticate').and.callThrough();

                myRequest.send().fail(function() {
                    expect(ajaxSpy.calls.count()).toEqual(1);
                    expect(authRefreshSpy.calls.count()).toEqual(1);
                    expect(authAuthenticateSpy.calls.count()).toEqual(1);
                    done();
                });

            });
        });

        describe('timeout failures', function() {

            it('should NOT retry by default', function() {
                var myRequest = request.create({ type: 'GET' }, { authFlow: mockAuth.mockImplicitGrantFlow() });
                var fun = getMockPromises(
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().resolve({}, 1, { status: 200 }).promise()
                );
                var ajaxSpy = spyOn($, 'ajax').and.callFake(fun);

                myRequest.send();

                expect(ajaxSpy.calls.count()).toEqual(1);
            });

            it('should allow setting maximum number of retries', function() {
                var myRequest = request.create({ type: 'GET' }, { maxRetries: 1, authFlow: mockAuth.mockImplicitGrantFlow() });
                var fun = getMockPromises(
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().resolve({}, 1, { status: 200 }).promise()
                );
                var ajaxSpy = spyOn($, 'ajax').and.callFake(fun);

                myRequest.send();

                expect(ajaxSpy.calls.count()).toEqual(2);
            });

            it('should NOT retry none 504 errors', function() {
                var myRequest = request.create({ type: 'GET' }, { maxRetries: 1, authFlow: mockAuth.mockImplicitGrantFlow() });
                var fun = getMockPromises(
                    $.Deferred().reject({ status: 404 }).promise(),
                    $.Deferred().resolve({}, 1, { status: 200 }).promise()
                );
                var ajaxSpy = spyOn($, 'ajax').and.callFake(fun);

                myRequest.send();

                expect(ajaxSpy.calls.count()).toEqual(1);
            });

            it('should NOT do more than maxRetries', function() {
                var myRequest = request.create({ type: 'GET' }, { maxRetries: 1, authFlow: mockAuth.mockImplicitGrantFlow() });
                var fun = getMockPromises(
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().resolve({}, 1, { status: 200 }).promise()
                );
                var ajaxSpy = spyOn($, 'ajax').and.callFake(fun);

                myRequest.send();

                expect(ajaxSpy.calls.count()).toEqual(2);
            });

            it('should correctly resolve the original deferred', function(done) {
                var myRequest = request.create({ type: 'GET' }, { maxRetries: 10, authFlow: mockAuth.mockImplicitGrantFlow() });
                var fun = getMockPromises(
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().reject({ status: 504 }).promise(),
                    $.Deferred().resolve({}, 1, { status: 200 }).promise()
                );
                var ajaxSpy = spyOn($, 'ajax').and.callFake(fun);

                myRequest.send().done(function(data) {
                    expect(ajaxSpy.calls.count()).toEqual(10);
                    done();
                });
            });
        });
    });

});

