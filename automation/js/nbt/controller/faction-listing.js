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
            $scope.league = null;

            function reset() {
                if ($scope.league)
                    $scope.league.minPilotCount = 10;

                $scope.showApplyButtons = true;
                $scope.showApplyToggle = true;
                $scope.showApplyForm = false;

                $scope.applicationData = {
                    name: null,
                    tags: null,
                    geo: null,
                    pilotCount: 10,
                    comments: null,
                    acceptedToS: null,
                    showPublic: true,
                    collaborate: true
                };
                $scope.geoNA = null;
                $scope.geoEU = null;
                $scope.geoAP = null;

                $scope.nameError = false;
                $scope.tagsError = false;
                $scope.pilotCountError = false;
                $scope.geoError = false;
                $scope.formError = false;
            }

            reset();
            var onFactions = function(factions) {
                $scope.factions = factions;

                for (var i = 0; i < factions.length; ++i) {
                    var faction = factions[i];
                    if (faction.application) {
                        $scope.showApplyToggle = false;
                        break;
                    }
                }
            };

            var reloadFactions = function() {
                if ($scope.league) {
                    nbtFaction.fetchFactionsForLeague($scope.league, nbtIdentity.get().token, function (factions) {
                        onFactions(factions);
                    });
                }
            };

            reloadFactions();

            $scope.canApplyToFaction = function(faction) {
                return faction && faction._links && faction._links.apply && !faction.application && faction.status==='Vacant';
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

            var validateForm = function() {
                $scope.nameError = false;
                $scope.tagsError = false;
                $scope.pilotCountError = false;
                $scope.geoError = false;
                $scope.formError = false;

                if ($scope.applicationData.geo.length === 0) {
                    $scope.geoError = true;
                    $scope.formError = true;
                }

                if (!$scope.applicationData.name || $scope.applicationData.name === '') {
                    $scope.nameError = true;
                    $scope.formError = true;
                }

                if ($scope.applicationData.tags && $scope.applicationData.tags.length > 8) {
                    $scope.tagsError = true;
                    $scope.formError = true;
                }

                if (!$scope.applicationData.pilotCount || $scope.applicationData.pilotCount < $scope.league.minPilotCount) {
                    $scope.pilotCountError = true;
                    $scope.formError = true;
                }

                return !$scope.formError;
            };

            $scope.apply = function(faction) {
                $scope.applicationData.geo = [];
                if ($scope.geoNA) $scope.applicationData.geo.push('NA');
                if ($scope.geoEU) $scope.applicationData.geo.push('EU');
                if ($scope.geoAP) $scope.applicationData.geo.push('AP');

                if (!validateForm())
                    return;

                nbtFaction.apply(faction, $scope.applicationData, nbtIdentity.get().token, function(resp) {
                    reset();
                    reloadFactions();
                });
            };

            $scope.update = function(faction) {
                $scope.applicationData.geo = [];
                if ($scope.geoNA) $scope.applicationData.geo.push('NA');
                if ($scope.geoEU) $scope.applicationData.geo.push('EU');
                if ($scope.geoAP) $scope.applicationData.geo.push('AP');

                if (!validateForm())
                    return;

                nbtLeague.updateApplication($scope.league, $scope.applicationData, nbtIdentity.get().token, function(resp) {
                    reset();
                    reloadFactions();
                });
            };

            $scope.cancel = function(faction) {
                reset();
                $scope.showApplyToggle = false;
            };

            $scope.cancelApplication = function(faction) {
                if (confirm("Click OK to withdraw your NBT faction application")) {
                    nbtLeague.cancelApplication($scope.league, faction.application, nbtIdentity.get().token, function (resp) {
                        reset();
                        reloadFactions();
                    });
                }
            };

            $scope.edit = function(faction) {
                $scope.applicationData = faction.application;
                $scope.showApplyForm = true;
                $scope.showApplyButtons = true;
                $scope.geoNA = false;
                $scope.geoEU = false;
                $scope.geoAP = false;

                for (var i=0; i<faction.application.geo.length; ++i) {
                    var geo = faction.application.geo[i];
                    if (geo === 'NA') $scope.geoNA = true;
                    if (geo === 'EU') $scope.geoEU = true;
                    if (geo === 'AP') $scope.geoAP = true;
                }
            };

            var cb = $scope.$on('nbtIdentityChanged', function(event, aIdent) {
                reset();
                reloadFactions();
            });
            $scope.$on('destroy', cb);

            var cb = $scope.$on('nbtLeagueChanged', function(event, aLeague) {
                $scope.league = aLeague;
                reset();
                reloadFactions();
            });
            $scope.$on('destroy', cb);
        }]);
})();
