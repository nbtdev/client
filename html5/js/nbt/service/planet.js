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

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtPlanet', ['$http', '$rootScope', 'nbtRoot', function($http, $rootScope, nbtRoot) {
        var self = this;
        var mPlanets = {};
        var mColors = {};

        var onMapColors = function(aResp) {
            $rootScope.$broadcast('nbtPlanetsLoaded')
        };

        var loadMapColors = function(aPlanets, aTokenHdr) {
            $http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanets._links.mapColors.href,
                headers: aTokenHdr.get()
            }).then(
                function(aResp) {
                    mColors[aPlanets._links.mapColors.href] = aResp.data._embedded;
                    onMapColors(aResp);
                },
                function(aResp) {
                    console.log(aResp);
                }
            );
        };

        // load a league's planet listing into the service
        this.load = function(aUrl, aToken) {
            var hdr = new Headers(Header.TOKEN, aToken);

            $http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aUrl,
                headers: hdr
            }).then(
                function(aResp) {
                    mPlanets[aUrl] = aResp.data._embedded;
                    loadMapColors(aResp.data, hdr);
                },
                function(aResp) {
                    console.log(aResp);
                }
            );
        };
    }]);
})();