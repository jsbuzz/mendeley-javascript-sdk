define(function(require) {

    'use strict';

    require('es5-shim');

    describe('folders api', function() {

        var api = require('api');
        var foldersApi = api.folders;
        var baseUrl = 'https://api.mendeley.com';

        var mockAuth = require('../mocks/auth');
        api.setAuthFlow(mockAuth.mockImplicitGrantFlow());

        describe('create method', function() {

            // Set up fake XHR to return Location header for first call and a folder for second call
            var apiRequest;
            var ajaxSpy;
            var ajaxRequest;
            var ajaxCalls = 0;
            var ajaxResponse = function() {
                var dfd = $.Deferred();
                if (ajaxCalls%2 === 0) {
                    dfd.resolve('', 1, {
                        status: 201,
                        getResponseHeader: function(header) {
                            return header === 'Location' ? baseUrl + '/folders/123' : null;
                        }
                    });
                }
                else {
                    dfd.resolve({ id: '123', name: 'foo' }, 1, {
                        getResponseHeader: function () { return null; }
                    });
                }
                ajaxCalls++;

                return dfd.promise();
            };

            it('should be defined', function() {
                expect(typeof foldersApi.create).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.callFake(ajaxResponse);
                apiRequest = foldersApi.create({ name: 'foo' });
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.first().args[0];
            });

            it('should use POST', function() {
                expect(ajaxRequest.type).toBe('POST');
            });

            it('should use endpoint /folders', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/folders');
            });

            it('should have a Content-Type header', function() {
                expect(ajaxRequest.headers['Content-Type']).toBeDefined();
            });

            it('should have an Authorization header', function() {
                expect(ajaxRequest.headers.Authorization).toBeDefined();
                expect(ajaxRequest.headers.Authorization).toBe('Bearer auth');
            });

            it('should have a body of JSON string', function() {
                expect(ajaxRequest.data).toBe('{"name":"foo"}');
            });

            it('should follow Location header', function() {
                var ajaxRedirect = ajaxSpy.calls.mostRecent().args[0];
                expect(ajaxRedirect.type).toBe('GET');
                expect(ajaxRedirect.url).toBe(baseUrl + '/folders/123');
            });

            it('should resolve with the data', function() {
                apiRequest.done(function(data) {
                    expect(data).toEqual({ id: '123', name: 'foo' });
                });
            });
        });

        describe('create method failures', function() {

            it('should reject create errors with the request and response', function() {
                var ajaxFailureResponse = function() {
                    var dfd = $.Deferred();
                    dfd.reject({ status: 500 });
                    return dfd.promise();
                };
                spyOn($, 'ajax').and.callFake(ajaxFailureResponse);
                foldersApi.create({ name: 'foo' }).fail(function(request, response) {
                    expect(request.type).toEqual('POST');
                    expect(response).toEqual({ status: 500 });
                });
            });

            it('should reject redirect errors with the request and the response', function() {
                var ajaxMixedCalls = 0;
                var ajaxMixedResponse = function() {
                    var dfd = $.Deferred();
                    // First call apparently works and returns location
                    if (ajaxMixedCalls === 0) {
                        dfd.resolve('', 1, {
                            getResponseHeader: function(header) {
                                return header === 'Location' ? baseUrl + '/folders/123' : null;
                            }
                        });
                    }
                    // But following the location fails
                    else {
                        dfd.reject({ status: 404 });
                    }
                    ajaxMixedCalls++;

                    return dfd.promise();
                };
                spyOn($, 'ajax').and.callFake(ajaxMixedResponse);
                foldersApi.create({ name: 'foo' }).fail(function(request, response) {
                    expect(request.type).toEqual('GET');
                    expect(response).toEqual({ status: 404 });
                });
            });
        });

        describe('retrieve method', function() {

            var ajaxSpy;
            var ajaxRequest;

            it('should be defined', function() {
                expect(typeof foldersApi.retrieve).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.returnValue($.Deferred().resolve());
                foldersApi.retrieve(123);
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use GET', function() {
                expect(ajaxRequest.type).toBe('GET');
            });

            it('should use endpoint /folders/{id}', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/folders/123');
            });

            it('should have a NOT have a Content-Type header', function() {
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

        describe('update method', function() {

            // Set up fake XHR to return an updated document
            var ajaxSpy;
            var ajaxRequest;
            var ajaxResponse = function() {
                var dfd = $.Deferred();
                dfd.resolve({ id: '123', name: 'bar' }, 1, {
                    getResponseHeader: function () { return null; }
                });

                return dfd.promise();
            };
            it('should be defined', function() {
                expect(typeof foldersApi.update).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.callFake(ajaxResponse);
                foldersApi.update(123, { name: 'bar' });
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use PATCH', function() {
                expect(ajaxRequest.type).toBe('PATCH');
            });

            it('should use endpoint /folders/{id}/', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/folders/123');
            });

            it('should have a Content-Type header', function() {
                expect(ajaxRequest.headers['Content-Type']).toBeDefined();
            });

            it('should have an Authorization header', function() {
                expect(ajaxRequest.headers.Authorization).toBeDefined();
                expect(ajaxRequest.headers.Authorization).toBe('Bearer auth');
            });

            it('should have a body of JSON string', function() {
                expect(ajaxRequest.data).toBe('{"name":"bar"}');
            });

        });

        describe('list method', function() {

            var ajaxSpy;
            var ajaxRequest;
            var params = {
                limit: 500
            };

            it('be defined', function() {
                expect(typeof foldersApi.list).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.returnValue($.Deferred().resolve());

                foldersApi.list(params);
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use GET', function() {
                expect(ajaxRequest.type).toBe('GET');
            });

            it('should use endpoint /folders/', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/folders/');
            });

            it('should NOT have a Content-Type header', function() {
                expect(ajaxRequest.headers['Content-Type']).not.toBeDefined();
            });

            it('should have an Authorization header', function() {
                expect(ajaxRequest.headers.Authorization).toBeDefined();
                expect(ajaxRequest.headers.Authorization).toBe('Bearer auth');
            });

            it('should apply request params', function() {
                expect(ajaxRequest.data).toEqual(params);
            });

        });

        describe('pagination', function() {

            var sendMendeleyCountHeader = true,
            folderCount = 56,
            sendLinks = true,
            linkNext = baseUrl + '/folders/?limit=5&reverse=false&marker=03726a18-140d-3e79-9c2f-b63473668359',
            linkLast = baseUrl + '/folders/?limit=5&reverse=true';

            function ajaxSpy() {
                return spyOn($, 'ajax').and.returnValue($.Deferred().resolve([], 'success', {
                    getResponseHeader: function(headerName) {
                        if (headerName === 'Link' && sendLinks) {
                            return ['<' + linkNext + '>; rel="next"', '<' + linkLast + '>; rel="last"'].join(', ');
                        } else if (headerName === 'Mendeley-Count' && sendMendeleyCountHeader) {
                            return folderCount.toString();
                        }

                        return null;
                    },
                    getAllResponseHeaders: function() {
                        return ['Link: <' + linkNext + '>; rel="next"', 'Link: <' + linkLast + '>; rel="last"'].join('\n');
                    }
                }));
            }

            it('should parse link headers', function() {
                ajaxSpy();
                foldersApi.paginationLinks.next = 'nonsense';
                foldersApi.paginationLinks.prev = 'nonsense';
                foldersApi.paginationLinks.last = 'nonsense';

                foldersApi.list();

                expect(foldersApi.paginationLinks.next).toEqual(linkNext);
                expect(foldersApi.paginationLinks.last).toEqual(linkLast);
                expect(foldersApi.paginationLinks.prev).toEqual(false);
            });

            it('should get correct link on nextPage()', function() {
                var spy = ajaxSpy();
                foldersApi.nextPage();
                expect(spy.calls.mostRecent().args[0].url).toEqual(linkNext);
            });

            it('should get correct link on lastPage()', function() {
                var spy = ajaxSpy();
                foldersApi.lastPage();
                expect(spy.calls.mostRecent().args[0].url).toEqual(linkLast);
            });

            it('should fail if no link for rel', function() {
                var spy = ajaxSpy();
                var result = foldersApi.previousPage();
                expect(result.state()).toEqual('rejected');
                expect(spy).not.toHaveBeenCalled();
            });

            it('should store the total document count', function() {
                ajaxSpy();
                foldersApi.list();
                expect(foldersApi.count).toEqual(56);

                sendMendeleyCountHeader = false;
                folderCount = 999;
                foldersApi.list();
                expect(foldersApi.count).toEqual(56);

                sendMendeleyCountHeader = true;
                folderCount = 0;
                foldersApi.list();
                expect(foldersApi.count).toEqual(0);
            });

            it('should not break when you GET something else that does not have pagination links', function() {

                ajaxSpy();

                foldersApi.list();

                expect(foldersApi.paginationLinks.next).toEqual(linkNext);
                expect(foldersApi.paginationLinks.last).toEqual(linkLast);
                expect(foldersApi.paginationLinks.prev).toEqual(false);

                sendLinks = false;
                foldersApi.retrieve(56);
                expect(foldersApi.paginationLinks.next).toEqual(linkNext);
                expect(foldersApi.paginationLinks.last).toEqual(linkLast);
                expect(foldersApi.paginationLinks.prev).toEqual(false);

            });
        });
    });

});
