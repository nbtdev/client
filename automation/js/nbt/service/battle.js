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

var _BattleService = (function() {
    var self = null;
    var http = null;
    var rootScope = null;

    function BattleService(aHttp, aRootScope) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
    }

    // load the detail for a battle on a particular planet
    BattleService.prototype.fetchBattleForPlanet = function (aPlanet, aToken, aCallback) {
        if (aPlanet._links.battle) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aPlanet._links.battle.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback)
                    aCallback(new _Battle(aResp.data));
                }
            );
        }
    };

    // load the list of sector assaults for a faction
    BattleService.prototype.fetchBattlesForFaction = function (aFaction, aToken, aCallback) {
        if (aFaction._links.battles) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aFaction._links.battles.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback)
                        aCallback(aResp.data);
                }
            );
        }
    };

    // load the list of sector assaults for a faction
    BattleService.prototype.fetchBattleDetail = function (aBattle, aToken, aCallback) {
        if (aBattle._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aBattle._links.self.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    if (aCallback)
                        aCallback(aResp.data);

                    // post event to any subscribers
                    rootScope.$broadcast('nbtBattleChanged', aResp.data);
                }
            );
        }
    };

    return BattleService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtBattle', ['$http', '$rootScope', function($http, $rootScope) {
        return new _BattleService($http, $rootScope);
    }]);
})();