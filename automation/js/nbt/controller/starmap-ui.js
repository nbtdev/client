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
        .controller('StarmapUiController', ['$sce', '$scope', 'nbtFaction', 'nbtPlanet', 'nbtLeague', 'nbtIdentity', function($sce, $scope, nbtFaction, nbtPlanet, nbtLeague, nbtIdentity) {
            $scope.factions = [];
            $scope.league = null;

            var reloadFactions = function(league) {
                nbtFaction.fetchFactionsForLeague(league, nbtIdentity.get().token, function (factions) {
                    $scope.factions = [];

                    for (var i = 0; i < factions.length; ++i) {
                        var f = factions[i];
                        $scope.factions.push({
                            id: f.id,
                            name: f.displayName,
                            _links: {
                                planets: f._links.planets,
                                sectors: f._links.sectors
                            }
                        });
                    }
                });
            };

            $scope.onFindPlanet = function() {
                var element = $("#ui-planet-search")[0];
                var list = element.list;

                var selected = null;
                for (var i=0; i < list.children.length; ++i) {
                    var o = list.children[i];
                    if (o.value === element.value) {
                        selected = o;
                        break;
                    }
                }

                var position = JSON.parse(selected.attributes['data-planet-position'].value);
                $scope.$parent.starmap.onPlanetSearch(position);
            };

            $scope.showAdminTools = function() {
                var token = nbtIdentity.get();
                return (token.isValid() && (token.isSiteAdmin() || token.isLeagueAdmin()));
            };

            $scope.onCreateSector = function() {
                var owner = JSON.parse($scope.selectedOwner);

                var planetIds = [];
                for (var i=0; i<$scope.$parent.selectedPlanets.length; ++i) {
                    var p = $scope.$parent.selectedPlanets[i];
                    planetIds.push(p.id);
                }

                var data = {
                    capitalPlanetId: $scope.selectedSectorCapital,
                    sectorPlanetIds: planetIds
                };

                nbtPlanet.createSector(owner, data, nbtIdentity.get().token, function(resp) {
                    // the service will send the post-update state of the planets (a list of Planet objects)
                    // so we need to let the parent know about this and deal with it as it may
                    // $scope.$parent.onPlanetsUpdated(resp);
                });
            };

            $scope.onEditSector = function() {
            };

            $scope.onDeleteSector = function() {
                // from the selected planet(s), figure out which sector(s) we are deleting...
                var sectors = {};
                for (var i=0; i<$scope.$parent.selectedPlanets.length; ++i) {
                    var planet = $scope.$parent.selectedPlanets[i];
                    var group = planet.parentGroup;

                    if (group.sectorId && group.sectorId > 0 && group._links.sector) {
                        sectors[group.sectorId] = group;
                    }
                }

                if (Object.keys(sectors).length > 0) {
                    nbtPlanet.deleteSectors(sectors, nbtIdentity.get().token, function() {
                        // remove sector from the parent starmap too
                    });
                }
            };

            $scope.onChangeOwner = function() {
                var owner = JSON.parse($scope.selectedOwner);

                var planetIds = [];
                var selectedPlanetCount = $scope.$parent.selectedPlanets.length;
                for (var i=0; i<selectedPlanetCount; ++i) {
                    var p = $scope.$parent.selectedPlanets[i];
                    planetIds.push(p.id);
                }

                nbtFaction.transferPlanetsToFaction(owner, planetIds, nbtIdentity.get().token, function(resp) {
                    // the service will send the post-update state of the planets (a list of Planet objects)
                    // so we need to let the parent know about this and deal with it as it may
                    $scope.$parent.onPlanetsUpdated(resp);
                });
            };

            $scope.onReloadStarmap = function() {
                console.log('Reloading starmap data...');
                $scope.$parent.reloadData();
            };

            var cbLeagueChanged = $scope.$on('nbtLeagueChanged', function (event, league) {
                $scope.league = league;
                reloadFactions(league);
            });
            $scope.$on('destroy', cbLeagueChanged);
        }]);
})();
