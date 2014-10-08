define(function(require) {

    'use strict';

    require('es5-shim');

    describe('files api', function() {

        var api = require('api');
        var filesApi = api.files;
        var baseUrl = 'https://api.mendeley.com';

        var mockAuth = require('../mocks/auth');
        api.setAuthFlow(mockAuth.mockImplicitGrantFlow());

        // Helper for getting a file blob in phantom vs. others
        function getBlob(content, type) {
            if (typeof window.WebKitBlobBuilder !== 'undefined') {
                var builder = new window.WebKitBlobBuilder();
                builder.append(content);
                return builder.getBlob(type);
            }
            return new Blob([content], { type: type });
        }

        describe('create method', function() {

            // Mock ajax to resolve successfully
            var ajaxSpy;
            var ajaxRequest;
            var ajaxResponse = function() {
                var dfd = $.Deferred();
                var fileResource = {
                    url: 'http://mendeley.cdn.com/123'
                };
                dfd.resolve(fileResource, 1, {
                    status: 201,
                    getResponseHeader: function () { return null; }
                });

                return dfd.promise();
            };
            var file = getBlob('hello', 'text/plain');
            file.name = '中文file name(1).pdf';

            it('should be defined', function() {
                expect(typeof filesApi.create).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.callFake(ajaxResponse);
                filesApi.create(file, 123);
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.first().args[0];

            });

            it('should use POST', function() {
                expect(ajaxRequest.type).toBe('POST');
            });

            it('should use endpoint /files', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/files');
            });

            it('should have a Content-Type header based on file type', function() {
                expect(ajaxRequest.headers['Content-Type']).toEqual('text/plain');
            });

            it('should have a Content-Disposition header based on file name', function() {
                expect(ajaxRequest.headers['Content-Disposition']).toEqual('attachment; filename*=UTF-8\'\'%E4%B8%AD%E6%96%87file%20name%281%29.pdf');
            });

            it('should have an Authorization header', function() {
                expect(ajaxRequest.headers.Authorization).toBe('Bearer auth');
            });

            it('should have an Link header', function() {
                expect(ajaxRequest.headers.Link).toBe('<' + baseUrl + '/documents/123>; rel="document"');
            });

            it('should have a body of the file contents', function() {
                expect(ajaxRequest.data).toEqual(file);
            });

            it('should use Content-Type application/octet-stream if no type', function() {
                var typelessFile = getBlob('hello', '');
                typelessFile.name = 'filename.pdf';
                ajaxSpy = spyOn($, 'ajax').and.callFake(ajaxResponse);

                filesApi.create(123, typelessFile);

                ajaxRequest = ajaxSpy.calls.first().args[0];
                expect(ajaxRequest.headers['Content-Type']).toEqual('application/octet-stream');
            });


        });

        describe('list method', function() {

            var ajaxSpy;
            var ajaxRequest;

            it('be defined', function() {
                expect(typeof filesApi.list).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.returnValue($.Deferred().resolve());
                filesApi.list('someId');
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use GET', function() {
                expect(ajaxRequest.type).toBe('GET');
            });

            it('should use endpoint /files?document_id=someId', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/files?document_id=someId');
            });

            it('should NOT have a Content-Type header', function() {
                expect(ajaxRequest.headers['Content-Type']).not.toBeDefined();
            });

            it('should have an Authorization header', function() {
                expect(ajaxRequest.headers.Authorization).toBeDefined();
                expect(ajaxRequest.headers.Authorization).toBe('Bearer auth');
            });

            it('should NOT have a body', function() {
                expect(ajaxRequest.data).toBeUndefined();
            });

        });

        describe('remove method', function() {

            var ajaxSpy;
            var ajaxRequest;

            it('be defined', function() {
                expect(typeof filesApi.remove).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.returnValue($.Deferred().resolve());
                filesApi.remove('fileId');
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use DELETE', function() {
                expect(ajaxRequest.type).toBe('DELETE');
            });

            it('should use endpoint /files/fileId', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/files/fileId');
            });

            it('should NOT have a Content-Type header', function() {
                expect(ajaxRequest.headers['Content-Type']).not.toBeDefined();
            });

            it('should have an Authorization header', function() {
                expect(ajaxRequest.headers.Authorization).toBeDefined();
                expect(ajaxRequest.headers.Authorization).toBe('Bearer auth');
            });

            it('should NOT have a body', function() {
                expect(ajaxRequest.data).toBeUndefined();
            });

        });
    });
});
