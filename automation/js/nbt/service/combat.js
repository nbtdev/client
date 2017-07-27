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

var _CombatService = (function() {
    var http = null;
    var rootScope = null;

    function CombatService(aHttp, aRootScope) {
        http = aHttp;
        rootScope = aRootScope;
    }

    // fetch combat unit types for league
    CombatService.prototype.fetchCombatUnitTypes = function (aLeague, aToken, aSuccess, aFailure) {
        if (aLeague._links.unitTypes) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aLeague._links.unitTypes.href,
                headers: hdr.get()
            }).then(
                function (aResp) { if (aSuccess) aSuccess(aResp.data); },
                function (aErr) { if (aFailure) aFailure(aErr); }
            );
        }
    };

    // update combat unit type
    CombatService.prototype.updateCombatUnitType = function (aType, aToken, aSuccess, aFailure) {
        if (aType._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'PUT', // TODO: GET FROM LINKS!
                url: aType._links.self.href,
                data: aType,
                headers: hdr.get()
            }).then(
                function (aResp) { if (aSuccess) aSuccess(aResp.data); },
                function (aErr) { if (aFailure) aFailure(aErr); }
            );
        }
    };

    // add new combat unit type
    CombatService.prototype.addCombatUnitType = function (aType, aToken, aSuccess, aFailure) {
        if (aType._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'POST', // TODO: GET FROM LINKS!
                url: aType._links.self.href,
                data: aType,
                headers: hdr.get()
            }).then(
                function (aResp) { if (aSuccess) aSuccess(aResp.data); },
                function (aErr) { if (aFailure) aFailure(aErr); }
            );
        }
    };

    // delete combat unit type
    CombatService.prototype.deleteCombatUnitType = function (aType, aToken, aSuccess, aFailure) {
        if (aType._links.self) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'DELETE', // TODO: GET FROM LINKS!
                url: aType._links.self.href,
                headers: hdr.get()
            }).then(
                function (aResp) { if (aSuccess) aSuccess(aResp.data); },
                function (aErr) { if (aFailure) aFailure(aErr); }
            );
        }
    };

    return CombatService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtCombat', ['$http', '$rootScope', function($http, $rootScope) {
        return new _CombatService($http, $rootScope);
    }]);
})();