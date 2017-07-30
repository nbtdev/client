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
        .controller('LeftBarController', ['$scope', 'nbtIdentity', 'nbtLeague', 'nbtPlanet', function($scope, nbtIdentity, nbtLeague, nbtPlanet) {
            $scope.showTransfer = false;
            $scope.showTransferCombatUnits = false;
            $scope.showDockUndockDropships = false;
            $scope.showSummary = false;
            $scope.showJumpshipSummary = false;
            $scope.planetGroups = null;
            $scope.faction = null;

            var league = null;
            var selectedPlanet = null;

            function filterPlanetGroups() {
                if (!($scope.planetGroups && $scope.faction))
                    return;

                // otherwise, filter us down to the planets/sectors we own
                var myPlanetGroups = [];
                for (var i=0; i<$scope.planetGroups.length; ++i) {
                    var group = $scope.planetGroups[i];
                    if (group.owner.id === $scope.faction.id)
                        myPlanetGroups.push(group);
                }

                $scope.planetGroups = myPlanetGroups;
            }

            $scope.onTransferCombatUnits = function() {
                if (selectedPlanet === null)
                    return;
            };

            var cbFaction = $scope.$on('nbtFactionChanged', function (event, aFaction) {
                // we only want to see ours, if we are in a faction
                $scope.faction = aFaction;
                filterPlanetGroups();
            });
            $scope.$on('destroy', cbFaction);

            var cbPlanets = $scope.$on('nbtPlanetsLoaded', function (event, aLeagueId, aPlanetGroups, aMapColors) {
                // we only want to see ours, if we are in a faction
                $scope.planetGroups = aPlanetGroups;
                filterPlanetGroups();
            });
            $scope.$on('destroy', cbPlanets);

            var cbLeague = $scope.$on('nbtLeagueChanged', function (event, aLeague) {
                league = aLeague;
            });
            $scope.$on('destroy', cbLeague);

            var cbSelectedPlanetChanged = $scope.$on('planetChanged', function (event, aPlanet) {
                $scope.showRightBar = false;
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
        }]);
})();
