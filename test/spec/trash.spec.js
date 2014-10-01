define(function(require) {

    'use strict';

    require('es5-shim');

    describe('trash api', function() {

        var api = require('api');
        var trashApi = api.trash;
        var baseUrl = 'https://api.mendeley.com';

        var mockAuth = require('../mocks/auth');
        api.setAuthFlow(mockAuth.mockImplicitGrantFlow());

        describe('retrieve method', function() {

            var ajaxSpy;
            var ajaxRequest;

            it('should be defined', function() {
                expect(typeof trashApi.retrieve).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.returnValue($.Deferred().resolve());
                trashApi.retrieve(15);
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use GET', function() {
                expect(ajaxRequest.type).toBe('GET');
            });

            it('should use endpoint /trash/{id}', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/trash/15');
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

        describe('list method', function() {

            var ajaxSpy;
            var ajaxRequest;
            var sampleData = {
                sort: 'created',
                order: 'desc',
                limit: 50
            };

            it('be defined', function() {
                expect(typeof trashApi.list).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.returnValue($.Deferred().resolve());

                trashApi.list(sampleData);
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use GET', function() {
                expect(ajaxRequest.type).toBe('GET');
            });

            it('should use endpoint /trash/', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/trash/');
            });

            it('should NOT have a Content-Type header', function() {
                expect(ajaxRequest.headers['Content-Type']).not.toBeDefined();
            });

            it('should have an Authorization header', function() {
                expect(ajaxRequest.headers.Authorization).toBeDefined();
                expect(ajaxRequest.headers.Authorization).toBe('Bearer auth');
            });

            it('should apply request params', function() {
                expect(ajaxRequest.data).toEqual(sampleData);
            });

        });

        describe('restore method', function() {

            var ajaxSpy;
            var ajaxRequest;

            it('should be defined', function() {
                expect(typeof trashApi.restore).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.returnValue($.Deferred().resolve());
                trashApi.restore(15);
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use POST', function() {
                expect(ajaxRequest.type).toBe('POST');
            });

            it('should use endpoint /trash/{id}/restore', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/trash/15/restore');
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

        describe('restore method failures', function() {

            it('should reject restore errors with the request and response', function() {
                var ajaxFailureResponse = function() {
                    var dfd = $.Deferred();
                    dfd.reject({ status: 404 });
                    return dfd.promise();
                };
                spyOn($, 'ajax').and.callFake(ajaxFailureResponse);
                trashApi.restore().fail(function(request, response) {
                    expect(request.type).toEqual('POST');
                    expect(response).toEqual({ status: 404 });
                });
            });

        });

        describe('destroy method', function() {

            var ajaxSpy;
            var ajaxRequest;

            it('should be defined', function() {
                expect(typeof trashApi.destroy).toBe('function');
                ajaxSpy = spyOn($, 'ajax').and.returnValue($.Deferred().resolve());
                trashApi.destroy(15);
                expect(ajaxSpy).toHaveBeenCalled();
                ajaxRequest = ajaxSpy.calls.mostRecent().args[0];
            });

            it('should use DELETE', function() {
                expect(ajaxRequest.type).toBe('DELETE');
            });

            it('should use endpoint /trash/{id}', function() {
                expect(ajaxRequest.url).toBe(baseUrl + '/trash/15');
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

        describe('pagination', function() {

            var sendMendeleyCountHeader = true,
                documentCount = 155,
                sendLinks = true;

            function ajaxSpy() {
                return spyOn($, 'ajax').and.returnValue($.Deferred().resolve([], 'success', {
                    getResponseHeader: function(headerName) {
                        if (headerName === 'Link' && sendLinks) {
                            return '<' + baseUrl + '/trash/' +
                            '?limit=5&reverse=false&sort=created&order=desc&marker=03726a18-140d-3e79-9c2f-b63473668359>; ' +
                            'rel="next",<' + baseUrl + '/trash/?limit=5&reverse=true&sort=created&order=desc>; rel="last"';
                        } else if (headerName === 'Mendeley-Count' && sendMendeleyCountHeader) {
                            return documentCount.toString();
                        }

                        return null;
                    },
                    getAllResponseHeaders: function() {
                        return 'Link: <' + baseUrl + '/trash/?limit=5&reverse=false&sort=created&order=desc&marker=03726a18-140d-3e79-9c2f-b63473668359>; rel="next"' +
                            '\n' +
                            'Link: <' + baseUrl + '/trash/?limit=5&reverse=true&sort=created&order=desc>; rel="last"';
                    }
                }));
            }

            it('should parse link headers', function() {
                ajaxSpy();
                trashApi.paginationLinks.next = 'nonsense';
                trashApi.paginationLinks.prev = 'nonsense';
                trashApi.paginationLinks.last = 'nonsense';

                trashApi.list();

                expect(trashApi.paginationLinks.next).toEqual(baseUrl + '/trash/?limit=5&reverse=false&sort=created&order=desc&marker=03726a18-140d-3e79-9c2f-b63473668359');
                expect(trashApi.paginationLinks.last).toEqual(baseUrl + '/trash/?limit=5&reverse=true&sort=created&order=desc');
                expect(trashApi.paginationLinks.prev).toEqual(false);
            });

            it('should get correct link on nextPage()', function() {
                var spy = ajaxSpy();
                trashApi.nextPage();
                expect(spy.calls.mostRecent().args[0].url).toEqual(baseUrl + '/trash/?limit=5&reverse=false&sort=created&order=desc&marker=03726a18-140d-3e79-9c2f-b63473668359');
            });

            it('should get correct link on lastPage()', function() {
                var spy = ajaxSpy();
                trashApi.lastPage();
                expect(spy.calls.mostRecent().args[0].url).toEqual(baseUrl + '/trash/?limit=5&reverse=true&sort=created&order=desc');
            });

            it('should fail if no link for rel', function() {
                var spy = ajaxSpy();
                var result = trashApi.previousPage();
                expect(result.state()).toEqual('rejected');
                expect(spy).not.toHaveBeenCalled();
            });

            it('should store the total trashed documents count', function() {
                ajaxSpy();
                trashApi.list();
                expect(trashApi.count).toEqual(155);

                sendMendeleyCountHeader = false;
                documentCount = 999;
                trashApi.list();
                expect(trashApi.count).toEqual(155);

                sendMendeleyCountHeader = true;
                documentCount = 0;
                trashApi.list();
                expect(trashApi.count).toEqual(0);
            });

            it('should not break when you GET something else that does not have pagination links', function() {
                trashApi.list();

                expect(trashApi.paginationLinks.next).toEqual(baseUrl + '/trash/?limit=5&reverse=false&sort=created&order=desc&marker=03726a18-140d-3e79-9c2f-b63473668359');
                expect(trashApi.paginationLinks.last).toEqual(baseUrl + '/trash/?limit=5&reverse=true&sort=created&order=desc');
                expect(trashApi.paginationLinks.prev).toEqual(false);

                sendLinks = false;
                trashApi.retrieve(155);
                expect(trashApi.paginationLinks.next).toEqual(baseUrl + '/trash/?limit=5&reverse=false&sort=created&order=desc&marker=03726a18-140d-3e79-9c2f-b63473668359');
                expect(trashApi.paginationLinks.last).toEqual(baseUrl + '/trash/?limit=5&reverse=true&sort=created&order=desc');
                expect(trashApi.paginationLinks.prev).toEqual(false);

            });
        });
    });

});
