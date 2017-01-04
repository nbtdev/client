/**
 Copyright (c) 2016, Netbattletech
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

var _PlanetService = (function() {
    var self = null;
    var http = null;
    var rootScope = null;
    var mPlanets = {};
    var mColors = {};

    function PlanetService(aHttp, aRootScope) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
    }

    var loadMapColors = function (aLeagueId, aPlanets, aTokenHdr) {
        http({
            method: 'GET', // TODO: GET FROM LINKS!
            url: aPlanets._links.mapColors.href,
            headers: aTokenHdr.get()
        }).then(
            function (aResp) {
                mColors[aLeagueId] = aResp.data._embedded;
                rootScope.$broadcast('nbtPlanetsLoaded', aLeagueId, mPlanets[aLeagueId.toString()].planets, mColors[aLeagueId.toString()].mapColors);
            },
            function (aResp) {
                console.log(aResp);
            }
        );
    };

    // load a league's planet listing into the service
    PlanetService.prototype.load = function (aLeague, aToken) {
        if (aLeague) {
            if (!aLeague.planetsLink())
                return;
        }

        var hdr = new Headers(Header.TOKEN, aToken);

        http({
            method: 'GET', // TODO: GET FROM LINKS!
            url: aLeague.planetsLink().href,
            headers: hdr.get()
        }).then(
            function (aResp) {
                mPlanets[aLeague.id()] = aResp.data._embedded;
                loadMapColors(aLeague.id(), aResp.data, hdr);
            },
            function (aResp) {
                console.log(aResp);
            }
        );
    };

    PlanetService.prototype.get = function (aLeague) {
        if (aLeague)
            return mPlanets[aLeague.id()];

        return null;
    };

    PlanetService.prototype.fetchPlanetDetail = function (aPlanet, aToken, aCallback) {
        if (aPlanet) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanet._links.self.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback)
                        aCallback(aResp.data);
                }
            );
        }
    };

    return PlanetService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtPlanet', ['$http', '$rootScope', function($http, $rootScope) {
        return new _PlanetService($http, $rootScope);
    }]);
})();