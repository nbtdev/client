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
        .controller('FactionListingController', ['$sce', '$scope', 'nbtFaction', 'nbtLeague', 'nbtIdentity', function($sce, $scope, nbtFaction, nbtLeague, nbtIdentity) {
            var self = this;

            $scope.league = nbtLeague.current();
            $scope.league.minPilotCount = 12;
            $scope.showApplyButtons = false;
            $scope.applicationData = {
                name: null,
                tags: null,
                geo: null,
                pilotCount: 12,
                comments: null,
                acceptedToS: null
            };
            $scope.geoNA = null;
            $scope.geoEU = null;
            $scope.geoAP = null;

            $scope.nameError = false;
            $scope.pilotCountError = false;
            $scope.geoError = false;

            nbtFaction.fetchFactionsForLeague($scope.league, nbtIdentity.get().token, function(factions) {
                $scope.factions = factions;
            });

            $scope.canApplyToFaction = function(faction) {
                return faction && faction._links && faction._links.apply;
            };

            $scope.canApply = function() {
                var token = nbtIdentity.get();
                if (token) {
                    return token.isValid() && !(
                        token.isSiteAdmin() ||
                        token.isLeagueAdmin() ||
                        token.isTeamAdmin()
                    );
                }

                return false;
            };

            $scope.apply = function(faction) {
                $scope.nameError = false;
                $scope.pilotCountError = false;
                $scope.geoError = false;

                $scope.applicationData.geo = [];
                if ($scope.geoNA) $scope.applicationData.geo.push('NA');
                if ($scope.geoEU) $scope.applicationData.geo.push('EU');
                if ($scope.geoAP) $scope.applicationData.geo.push('AP');

                if ($scope.applicationData.geo.length === 0)
                    $scope.geoError = true;

                if (!$scope.applicationData.name || $scope.applicationData.name === '')
                    $scope.nameError = true;

                if (!$scope.applicationData.pilotCount || $scope.applicationData.pilotCount < $scope.league.minPilotCount)
                    $scope.pilotCountError = true;

                if ($scope.nameError || $scope.pilotCountError || $scope.geoError)
                    return;

                nbtFaction.apply(faction, $scope.applicationData, nbtIdentity.get().token, function(resp) {
                    // remove the Apply button
                    faction.applicationSubmitted = true;
                });
            };
        }]);
})();
