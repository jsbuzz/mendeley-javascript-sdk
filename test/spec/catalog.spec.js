define(function(require) {

    'use strict';

    require('es5-shim');

    describe('catalog api', function() {

        var api = require('api');
        var catalogApi = api.catalog;
        var baseUrl = 'https://api.mendeley.com';

        var mockAuth = require('../mocks/auth');
        api.setAuthFlow(mockAuth.mockImplicitGrantFlow());

        describe('search method', function() {
            var ajaxSpy;
            var ajaxRequest;
            var params = {
                filehash: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d' // SHA1('hello')
            };

            it('should be defined', function() {
                expect(typeof catalogApi.search).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.returnValue($.Deferred().resolve());
                catalogApi.search(params);
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use GET', function() {
                expect(ajaxRequest.type).toBe('GET');
            });

            it('should use endpoint /catalog', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/catalog');
            });

            it('should have a NOT have a Content-Type header', function() {
                expect(ajaxRequest.headers['Content-Type']).not.toBeDefined();
            });

            it('should have an Authorization header', function() {
                expect(ajaxRequest.headers.Authorization).toBeDefined();
                expect(ajaxRequest.headers.Authorization).toBe('Bearer auth');
            });

            it('should allow paramaters', function() {
                expect(ajaxRequest.data).toEqual(params);
            });

        });
    });
});
