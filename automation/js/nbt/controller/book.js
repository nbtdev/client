/**
 Copyright (c) 2017, Netbattletech
 All rights reserved.

 Redistribution and use in source and binary forms, with or without modification, are
 permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
 THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
 OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function() {
    angular
        .module('nbt.app')
        .controller('ESportsBookController', ['$scope', '$timeout', '$http', 'nbtIdentity', 'nbtRoot', function($scope, $timeout, $http, nbtIdentity, nbtRoot) {
            $scope.root = null;
            $scope.events = null;
            $scope.newEvent = null;

            function fetchEvents() {
                var links = nbtRoot.links();
                $http({
                    method: 'GET',
                    url: links.book.href
                }).then(
                    function (aResp) {
                        processEvents(aResp.data);
                    }
                );
            }

            $scope.onReload = function() {
                fetchEvents();
            };

            function processEvents(data) {
                $scope.events = data._embedded.bookEvents;
                $scope.events._links = data._links;
            }

            function saveChanges(obj, collectionUrl, selfUrl) {
                var method = 'PUT';
                var isAdd = obj.id <= 0;
                var url;

                if (isAdd) {
                    method = 'POST';
                    url = collectionUrl;
                } else {
                    url = selfUrl;
                }

                var hdrs = new Headers(Header.TOKEN, nbtIdentity.get().token);

                $http({
                    method: method,
                    headers: hdrs.get(),
                    data: obj,
                    url: url
                }).then(
                    function (aResp) {
                        if (isAdd)
                            processEvents(aResp.data);

                        obj.operationSuccess = true;
                        obj.editing = false;
                        $scope.newEvent = null;

                        $timeout(function() {
                            obj.operationSuccess = null;
                        }, 2000);
                    },
                    function (aErr) {
                        obj.operationFailure = true;

                        $timeout(function() {
                            obj.operationFailure = null;
                        }, 2000);
                    }
                );
            }

            $scope.onAddContestant = function(event) {
                var contestant = {
                    id: -1,
                    editing: true,
                    _links: { self: {} }
                };

                if (!event.participants)
                    event.participants = [];

                event.participants.push(contestant);
            };

            $scope.onDelete = function(event) {
                var hdrs = new Headers(Header.TOKEN, nbtIdentity.get().token);

                $http({
                    method: 'DELETE',
                    headers: hdrs.get(),
                    url: event._links.self.href
                }).then(
                    function (aResp) {
                        processEvents(aResp.data);
                    },
                    function (aErr) {
                        event.operationFailure = true;

                        $timeout(function() {
                            event.operationFailure = null;
                        }, 2000);
                    }
                );
            };

            $scope.onEdit = function(obj) {
                obj.editing = true;
            };

            $scope.onCancel = function(obj) {
                obj.editing = false;

                if (obj.id <= 0) {
                    // remove it from the event array
                    var idx = $scope.events.findIndex(function(e) {
                        return (obj.id === e.id);
                    });

                    if (idx >= 0)
                        $scope.events.splice(idx, 1);

                    $scope.newEvent = null;
                }
            };

            $scope.onAdd = function() {
                $scope.newEvent = {
                    id: -1,
                    editing: true
                };

                $scope.events.push($scope.newEvent);
            };

            $scope.onApplyEvent = function(obj) {
                saveChanges(obj, $scope.events._links.self.href, obj._links.self.href);
            };

            $scope.onApplyContestant = function(event, obj) {
                saveChanges(obj, event._links.contestants.href, obj._links.self.href);
            };

            fetchEvents();
        }]);
})();
