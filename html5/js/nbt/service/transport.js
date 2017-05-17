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

var _TransportService = (function() {
    var self = null;
    var http = null;
    var rootScope = null;

    function TransportService(aHttp, aRootScope) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
    }

    // fetch the dropships present on a particular planet
    TransportService.prototype.fetchDropshipsForPlanet = function (aPlanet, aToken, aCallback) {
        if (aPlanet._links.dropships) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanet._links.dropships.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback && aResp.data._embedded)
                        aCallback(aResp.data._embedded.dropships);
                }
            );
        }
    };

    // fetch the jump types allowed with aPlanet as the origin
    TransportService.prototype.fetchJumpTypesFromPlanet = function (aPlanet, aToken, aCallback) {
        if (aPlanet._links.jumpTypes) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanet._links.jumpTypes.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback && aResp.data._embedded)
                        aCallback(aResp.data._embedded.jumpTypes);
                }
            );
        }
    };

    // fetch the jump actions allowed with aPlanet as the origin
    TransportService.prototype.fetchJumpActionsFromPlanet = function (aPlanet, aToken, aCallback) {
        if (aPlanet._links.jumpActions) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanet._links.jumpActions.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback && aResp.data._embedded)
                        aCallback(aResp.data._embedded.jumpActions);
                }
            );
        }
    };

    // fetch the jumpship(s) present at a particular planet
    TransportService.prototype.fetchJumpshipsForPlanet = function (aPlanet, aToken, aCallback) {
        if (aPlanet._links.jumpships) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanet._links.jumpships.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback && aResp.data._embedded)
                        aCallback(aResp.data._embedded.jumpships);
                }
            );
        }
    };

    var transferUnitInstances = function(aPlanet, aCombatUnits, aDropship, aDirection, aToken, aCallback, aFail) {
        if (aDropship._links.unitInstances) {
            var hdr = new Headers(Header.TOKEN, aToken);
            var data = {
                direction: aDirection,
                unitInstances: aCombatUnits
            };

            http({
                method: 'PUT', // TODO: GET FROM LINKS!
                url: aDropship._links.unitInstances.href,
                headers: hdr.get(),
                data: data
            }).then(
                function (aResp) {
                    if (aCallback && aResp.data._embedded)
                        aCallback(aResp.data);
                },
                function (aError) {
                    if (aFail)
                        aFail(aError);
                }
            );
        }
    };

    TransportService.prototype.transferCombatUnitsPlanetToDropship = function(aPlanet, aCombatUnits, aDropship, aToken, aCallback, aFail) {
        transferUnitInstances(aPlanet, aCombatUnits, aDropship, 1, aToken, aCallback, aFail);
    };

    TransportService.prototype.transferCombatUnitsDropshipToPlanet = function(aPlanet, aCombatUnits, aDropship, aToken, aCallback, aFail) {
        transferUnitInstances(aPlanet, aCombatUnits, aDropship, -1, aToken, aCallback, aFail);
    };

    var performDropshipOperation = function(aDirection, aPlanet, aDropships, aJumpship, aToken, aCallback, aFail) {
        // the jumpships resource tree will use DELETE to drop dropships, and POST to dock them
        var rel = aJumpship._links.dropships;

        if (!rel) {
            aFail({data: {message: "Missing link to jumpship's 'dropships' resource"}});
            return;
        }

        var hdr = new Headers(Header.TOKEN, aToken);
        var data = { direction: aDirection, dropships: aDropships };

        http({
            method: 'PUT',
            url: rel.href,
            headers: hdr.get(),
            data: data
        }).then(
            function (aResp) {
                if (aCallback)
                    aCallback(aResp.data);
            },
            function (aError) {
                if (aFail)
                    aFail(aError);
            }
        );
    };

    TransportService.prototype.dockDropships = function(aPlanet, aDropships, aJumpship, aToken, aCallback, aFail) {
        performDropshipOperation(1, aPlanet, aDropships, aJumpship, aToken, aCallback, aFail);
    };

    TransportService.prototype.undockDropships = function(aPlanet, aDropships, aJumpship, aToken, aCallback, aFail) {
        performDropshipOperation(-1, aPlanet, aDropships, aJumpship, aToken, aCallback, aFail);
    };

    TransportService.prototype.jumpJumpships = function(aPath, aJumpships, aType, aAction, aToken, aCallback, aFail) {
        if (!aPath || !aJumpships || !aType || !aAction) {
            aFail({data: {message: "Invalid or missing jump parameters"}});
            return;
        }

        if (aJumpships.length == 0) {
            aFail({data: {message: "No jumpships in operation, aborting"}});
            return;
        }

        var link = aJumpships[0]._links.up;

        var hdr = new Headers(Header.TOKEN, aToken);
        var data = {
            jumpships: aJumpships,
            jumpPath: aPath,
            type: aType,
            action: aAction
        };

        http({
            method: 'PUT',
            url: link.href,
            headers: hdr.get(),
            data: data
        }).then(
            function (aResp) {
                if (aCallback)
                    aCallback(aResp.data);
            },
            function (aError) {
                if (aFail)
                    aFail(aError);
            }
        );
    };

    return TransportService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtTransport', ['$http', '$rootScope', function($http, $rootScope) {
        return new _TransportService($http, $rootScope);
    }]);
})();