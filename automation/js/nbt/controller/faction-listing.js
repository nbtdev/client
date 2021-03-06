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

            function updateDiplomacy() {
                if (!($scope.alliances && $scope.factions))
                    return;

                $scope.factions.forEach(function(e,i,a) {
                    var setting = $scope.alliances[e.id];
                    if (setting) {
                        e.diplomacy = setting;
                    } else {
                        e.diplomacy = { level: 0 };
                    }
                });
            }

            function processAlliances(alliances) {
                // update the alliance levels for each in $scope.factions
                $scope.alliances = {};

                // populate alliance lookup table
                alliances.forEach(function (e, i, a) {
                    $scope.alliances[e.ally.id] = e;
                });

                updateDiplomacy();
            }

            function nameCompare(a, b) {
                if (a.name < b.name) return -1;
                else if (a.name > b.name) return 1;
                else return 0;
            }

            function fetchRoster(faction) {
                // fetch and process faction roster
                faction.roster = null;
                nbtFaction.fetchRoster(faction, nbtIdentity.get().token, function(roster) {
                    var admins = [];
                    var pilots = [];

                    roster._embedded.pilots.forEach(function(e) {
                        if (e.admin) admins.push(e);
                        else pilots.push(e);
                    });

                    admins = admins.sort(nameCompare);
                    var sorted = admins.concat(pilots.sort(nameCompare));

                    faction.roster = sorted;
                });
            }

            function fetchDiplomacy(faction) {
                // fetch and process faction diplomacy
                faction.diplomacy = null;
                nbtFaction.fetchDiplomacyData(faction, nbtIdentity.get().token, function(diplomacy) {
                    faction.diplomacy = diplomacy._embedded.alliances;

                    faction.diplomacy.sort(function(a,b) { return nameCompare(a.ally, b.ally); } );
                });
            }

            function fetchBattles(faction) {
                // fetch and process faction battles
                faction.battles = null;
                nbtFaction.fetchFactionBattles(faction, false, nbtIdentity.get().token, function(battles) {
                    faction.battles = battles._embedded.sectorBattles;

                    faction.battles.sort(function(a, b) { return b.id - a.id; });

                    faction.wins = 0;
                    faction.losses = 0;
                    faction.defends = 0;
                    faction.attacks = 0;

                    faction.battles.forEach(function(e) {
                        var isAttacker = e.attacker.id === faction.id;
                        var isDefender = !isAttacker;

                        if (isAttacker && (e.outcome === 'Attacker Victorious' || e.outcome === 'Defender Retreat'))
                            faction.wins++;
                        if (isDefender && (e.outcome === 'Defender Victorious' || e.outcome === 'Attacker Retreat'))
                            faction.wins++;
                        if (isAttacker && (e.outcome === 'Defender Victorious' || e.outcome === 'Attacker Retreat'))
                            faction.losses++;
                        if (isDefender && (e.outcome === 'Attacker Victorious' || e.outcome === 'Defender Retreat'))
                            faction.losses++;

                        e.isActive = (e.status !== 'Verified');
                        if (isAttacker && e.isActive)
                            faction.attacks++;
                        if (isDefender && e.isActive)
                            faction.defends++;
                    });
                })
            }

            $scope.onDetail = function(faction) {
                $scope.faction = faction;

                // fetch some further faction detail, including defend data
                nbtFaction.fetchFactionDetail(faction, nbtIdentity.get().token, function(data) {
                    $scope.faction = data;

                    fetchRoster(data);
                    fetchDiplomacy(data);
                    fetchBattles(data);
                });
            };

            $scope.onBack = function() {
                $scope.faction = null;
            };

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
