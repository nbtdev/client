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
                    if (aCallback)
                        aCallback(aResp.data._embedded.dropships);
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
                    if (aCallback)
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

    return TransportService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtTransport', ['$http', '$rootScope', function($http, $rootScope) {
        return new _TransportService($http, $rootScope);
    }]);
})();