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
    .controller('NavbarController', ['$scope', '$rootScope', 'nbtIdentity', 'nbtLeague', 'nbtFaction', function($scope, $rootScope, nbtIdentity, nbtLeague, nbtFaction) {

        var reset = function() {
            $scope.league = null;
            $scope.leagues = null;
            $scope.identity = null;
            $scope.faction = null;
        };

        reset();

        $scope.isAdmin = function() {
            var token = nbtIdentity.get();
            if (token.isValid())
                return token.isSiteAdmin() || token.isLeagueAdmin();

            return false;
        };

        $scope.isTeamAdmin = function() {
            var token = nbtIdentity.get();
            if (token.isValid())
                return token.isTeamAdmin();

            return false;
        };

        $scope.isLoggedIn = function() {
            return localStorage.getItem("nbtIdentity") !== null;
        };

        $scope.signOut = function() {
            nbtIdentity.logout();
            localStorage.removeItem("nbtIdentity");
        };

        var cbIdentity = $scope.$on('nbtIdentityChanged', function (event, aData) {
            $scope.identity = aData;
            $scope.faction = null;
        });
        $scope.$on('destroy', cbIdentity);

        var setCurrentLeague = function(leagueId) {
            $scope.league = null;
            for (var i=0; i<$scope.leagues.length; ++i) {
                var l = $scope.leagues[i];
                if (l.id == leagueId) {
                    $scope.league = l;

                    // fire off a request to get the user profile for the current league
                    nbtLeague.fetchLeagueProfile($scope.league, nbtIdentity.get().token, function(aData) {
                        // fire off a request to get the faction I am in, if any
                        nbtFaction.fetchFactionDetail(aData.data.faction, nbtIdentity.get().token, function(aFaction) {
                            $scope.faction = aFaction;
                            $rootScope.$broadcast('nbtFactionChanged', $scope.faction);
                        });
                    });
                    break;
                }
            }

            if ($scope.league)
                $rootScope.$broadcast('nbtLeagueChanged', $scope.league);
        };

        var cbLeague = $scope.$on('nbtLeaguesChanged', function (event, leagues, leaguesRaw) {
            $scope.leagues = leaguesRaw;

            var leagueId = localStorage.getItem("leagueId");
            setCurrentLeague(leagueId);
        });
        $scope.$on('destroy', cbLeague);

        $scope.onLeagueClicked = function(leagueId) {
            localStorage.setItem("leagueId", leagueId);
            setCurrentLeague(leagueId);
        };

        $("a.nbt-menu-item").on("click", function(event) {
            $rootScope.$broadcast(event.target.dataset.target);
        });

        nbtLeague.fetchLeagues(nbtIdentity.get().token);
    }]);
})();
