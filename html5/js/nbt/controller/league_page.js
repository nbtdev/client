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
        .controller('LeaguePageController', ['$scope', 'nbtIdentity', 'nbtLeague', 'nbtPlanet', function($scope, nbtIdentity, nbtLeague, nbtPlanet) {
            $scope.getLogo = function(data) {
                var rtn = 'data:image/jpeg;base64,' + data.logo();
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
                    var rtn = 'data:image/jpeg;base64,' + league.logo();
                    return rtn;
                }

                return null;
            };

            $scope.getLogoSmall = function(data) {
                var rtn = 'data:image/jpeg;base64,' + data.logoSmall();
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

            var user = nbtIdentity.get();
            var league = nbtLeague.current();

            var loadStarmap = function(league, user) {
                if (!league || !user)
                    return;

                nbtPlanet.load(league, user.token);
            };

            var cbIdentity = $scope.$on('nbtIdentityChanged', function (event, aData) {
                user = aData;
                loadStarmap(league, user);
            });
            $scope.$on('destroy', cbIdentity);

            var cbLeague = $scope.$on('nbtLeagueChanged', function (event, aData) {
                league = aData;
                loadStarmap(league, user);
            });
            $scope.$on('destroy', cbLeague);

            $scope.leagues = null;

            loadStarmap(nbtLeague.current(), nbtIdentity.get());
        }]);
})();
