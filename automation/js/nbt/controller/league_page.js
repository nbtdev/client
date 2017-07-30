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
            $scope.showTransfer = false;
            $scope.showTransferCombatUnits = false;
            $scope.showDockUndockDropships = false;
            $scope.showLeftBar = false;
            $scope.showRightBar = false;
            $scope.factionActive = false;
            $scope.showSummary = false;
            $scope.showJumpshipSummary = false;

            $scope.getLogo = function(data) {
                // we want the link directly to the logo
                var rtn = data.logo(true);
                return rtn;
            };

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

            $scope.canJoin = function() {
                var token = nbtIdentity.get();
                if (token.isValid())
                    return !(
                        token.isSiteAdmin() ||
                        token.isTeamAdmin() ||
                        token.isLeagueAdmin()
                    );

                return false;
            };

            var getCurrentLeague = function() {
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

                return league;
            };

            $scope.getCurrentLeagueLogo = function() {
                var league = getCurrentLeague();

                if (league) {
                    // we want the URL directly to the logo
                    var rtn = league.logo(true);
                    return rtn;
                }

                return null;
            };

            $scope.getCurrentLeagueLogoSmall = function() {
                var league = getCurrentLeague();

                if (league) {
                    // we want the URL directly to the logo
                    var rtn = league.logoSmall(true);
                    return rtn;
                }

                return null;
            };

            $scope.getLogoSmall = function(data) {
                // we want the URL directly to the logo
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

            var user = nbtIdentity.get();
            var league = null;
            var selectedPlanet = null;

            $scope.onTransferCombatUnits = function() {
                if (selectedPlanet === null)
                    return;
            };

            var loadStarmap = function(league, user) {
                if (!league || !user)
                    return;

                nbtPlanet.load(league, user.token);
            };

            var cbFaction = $scope.$on('nbtFactionChanged', function (event, aFaction) {
                if (aFaction.status === "Active" || aFaction.status === "Semi-Active")
                    $scope.factionActive = true;
            });
            $scope.$on('destroy', cbFaction);

            var cbIdentity = $scope.$on('nbtIdentityChanged', function (event, aData) {
                user = aData;
                loadStarmap(league, user);
            });
            $scope.$on('destroy', cbIdentity);

            var cbLeague = $scope.$on('nbtLeagueChanged', function (event, aLeague) {
                league = aLeague;
            });
            $scope.$on('destroy', cbLeague);

            var cbSelectedPlanetChanged = $scope.$on('planetChanged', function (event, aPlanet) {
                $scope.showRightBar = false;
                $scope.showLeftBar = false;
                $scope.showSummary = false;

                if (selectedPlanet === aPlanet) {
                    return;
                }

                selectedPlanet = aPlanet;

                var localShowTransferCombatUnits = false;
                var localShowDockUndockDropships = false;
                var localShowJumpshipSummary = false;

                if (selectedPlanet) {
                    // currently, dropships are required in order to be able to transfer something...
                    if (selectedPlanet.dropshipCount && selectedPlanet.dropshipCount > 0) {
                        localShowTransferCombatUnits = true;
                    }

                    if (selectedPlanet.jumpshipCount && selectedPlanet.jumpshipCount > 0) {
                        localShowDockUndockDropships = true;
                        localShowJumpshipSummary = true;
                        $scope.showSummary = true;
                        $scope.showLeftBar = true;
                        $scope.showRightBar = true;
                    }
                }

                $scope.showTransfer = localShowDockUndockDropships || localShowTransferCombatUnits;
                $scope.showTransferCombatUnits = localShowTransferCombatUnits;
                $scope.showDockUndockDropships = localShowDockUndockDropships;
                $scope.showJumpshipSummary = true;
                $scope.$digest();
            });
            $scope.$on('destroy', cbSelectedPlanetChanged);

            $scope.leagues = null;

            loadStarmap(league, nbtIdentity.get());
        }]);
})();
