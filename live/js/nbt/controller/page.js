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
    angular
        .module('nbt.app')
        .controller('PageController', ['$scope', 'nbtIdentity', 'nbtLeague', function($scope, nbtIdentity, nbtLeague) {
            $scope.getLogo = function(data) {
                // ask for direct URL to logo
                var rtn = data.logo(true);
                return rtn;
            };

            $scope.getCurrentLeagueLogo = function() {
                // if there are leagues...
                var leagues = nbtLeague.leagues();
                var league = null;

                if (leagues) {
                    // ... and if there is one selected already, choose it...
                    if (localStorage.nbtLeague) {
                        var leagueId = parseInt(localStorage.nbtLeague);
                        league = nbtLeague.get(leagueId);
                    } else {
                        // ... just pick the first one in the list
                        league = nbtLeague.first();
                    }
                }

                if (league) {
                    // ask for direct URL
                    var rtn = league.logo(true);
                    return rtn;
                }

                return null;
            };

            $scope.getLogoSmall = function(data) {
                // ask for direct URL to small logo
                var rtn = data.logoSmall(true);
                return rtn;
            };

            $scope.getUsername = function() {
                if (localStorage.nbtIdentity)
                    return JSON.parse(localStorage.nbtIdentity).username;
            };

            $scope.isLoggedIn = function() {
                return localStorage.getItem("nbtIdentity") !== null;
            };

            $scope.signOut = function() {
                nbtIdentity.logout();
                localStorage.removeItem("nbtIdentity");
            };

            $scope.onLeagueClicked = function(league) {
                localStorage.setItem('currentLeague', league.serialize());

                // navigate to League interface page
                window.location.href = '/league.shtml';
            };

            // when the list of leagues changed, we want to update our list display
            cb = $scope.$on('nbtLeaguesChanged', function(event, aLeagues) {
                $scope.leagues = aLeagues;
            });
            $scope.$on('destroy', cb);

            $scope.leagues = null;
            nbtLeague.fetchLeagues(nbtIdentity.get().token);
        }]);
})();