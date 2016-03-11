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

var _FactionService = (function() {
    var self = null;
    var http = null;
    var rootScope = null;
    var mFactions = {};

    function FactionService(aHttp, aRootScope) {
        self = this;
        http = aHttp;
        rootScope = aRootScope;
    }

    FactionService.prototype.fetchFactionsForLeague = function(aLeague, aToken) {
        if (aLeague._links.factions) {
            var hdr = new Headers(Header.TOKEN, aToken);

            http({
                method: 'GET', // TODO: GET FROM LINKS!
                url: aLeague._links.factions.href,
                headers: hdr.get()
            }).then(
                function (aResp) {
                    // populate faction database with response
                    var factions = {};
                    var resp = aResp.data;

                    for (var i=0; i<resp._embedded.length; ++i) {
                        var f = resp._embedded[i];
                        factions[f.id] = new Faction(f);
                    }

                    mFactions[aLeague.id()] = factions;
                }
            );
        }
    };

    FactionService.prototype.findFactionInLeague = function(aLeague) {
        if (aLeague) {
            if (mFactions[aLeague.id()]) {
                return mFactions[aLeague.id()];
            }
        }

        return null;
    };

    return FactionService;
})();

(function() {
    var mod = angular.module('nbt.app');

    mod.service('nbtFaction', ['$http', '$rootScope', function($http, $rootScope) {
        return new _FactionService($http, $rootScope);
    }]);
})();