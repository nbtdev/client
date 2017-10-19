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
        .controller('PlanetsController', ['$sce', '$scope', '$timeout', '$rootScope', 'nbtFaction', 'nbtPlanet', 'nbtTransport', 'nbtIdentity', function($sce, $scope, $timeout, $rootScope, nbtFaction, nbtPlanet, nbtTransport, nbtIdentity) {
            $scope.faction = null;
            $scope.planets = null;
            $scope.identity = null;
            $scope.filteredPlanets = null;

            function setOperationStatus(message, success) {
                setStatusWithTimeout($scope, $timeout, message, success, 5000);
            }

            function compareName(a, b) {
                if (a.name < b.name) return -1;
                else if (a.name > b.name) return 1;
                return 0;
            }

            function compareTonnage(a, b) {
                return a.tonnage - b.tonnage;
            }

            function reloadPlanets() {
                nbtFaction.fetchPlanets($scope.faction, nbtIdentity.get().token, function(aPlanets) {
                    $scope.planets = aPlanets._embedded.planets;
                    $scope.planetTotal = 0;
                    $scope.industryTotal = 0;
                    $scope.combatUnitTotal = 0;
                    $scope.jumpshipTotal = 0;
                    $scope.dropshipTotal = 0;
                    $scope.chargeStationTotal = 0;
                    $scope.factoryPlanetTotal = 0;

                    // count up the totals
                    $scope.planets.forEach(function(e) {
                        $scope.planetTotal++;
                        $scope.industryTotal += (e.industry || 0);
                        $scope.combatUnitTotal += (e.combatUnitCount || 0);
                        $scope.jumpshipTotal += (e.jumpshipCount || 0);
                        $scope.dropshipTotal += (e.dropshipCount || 0);
                        $scope.chargeStationTotal += (e.chargeStation || 0);
                        $scope.factoryPlanetTotal += (e.factory ? 1 : 0);
                    });

                    $scope.planets.sort(compareName);
                    $scope.filteredPlanets = $scope.planets;

                    // when users click on a planet link in the listing, we want to trigger a camera move
                    // on the starmap to that planet; in order to get these bindings to happen after the next digest,
                    // we put a zero timeout in the queue to perform this
                    $timeout(function() {
                        $("#planetsDialog a").on("click", onPlanetClicked);
                    }, 0);
                });
            }

            function makeUnitInstanceSummary(instances) {
                var summary = {};

                instances.forEach(function(e) {
                    var entry = summary[e.template.id];
                    if (!entry) {
                        entry = {
                            name: e.template.name,
                            tonnage: e.template.tonnage,
                            count: 0
                        };

                        summary[e.template.id] = entry;
                    }

                    entry.count++;
                });

                var list = [];
                Object.values(summary).forEach(function(v) {
                    list.push(v);
                });

                list.sort(compareTonnage);

                return list;
            }

            function onPlanetClicked(event) {
                $rootScope.$broadcast('planetSearchRequest', event.currentTarget.innerHTML);
            }

            function processPlanet(planet) {
                var summaries = {};
                var summaryGroups = {
                    Light: [],
                    Medium: [],
                    Heavy: [],
                    Assault: []
                };

                planet.combatUnits.forEach(function(e) {
                    var summary = summaries[e.template.id];
                    if (!summary) {
                        summary = {
                            template: e.template,
                            tonnage: e.template.tonnage,
                            count: 0
                        };
                        summaries[e.template.id] = summary;

                        if (e.template.tonnage <= 35) summaryGroups.Light.push(summary);
                        else if (e.template.tonnage <=55) summaryGroups.Medium.push(summary);
                        else if (e.template.tonnage <=75) summaryGroups.Heavy.push(summary);
                        else summaryGroups.Assault.push(summary);
                    }

                    summary.count++;
                });

                planet.combatUnitSummaries = summaries;
                planet.combatUnitSummaryGroups = summaryGroups;
                summaryGroups.Light.sort(compareTonnage);
                summaryGroups.Medium.sort(compareTonnage);
                summaryGroups.Heavy.sort(compareTonnage);
                summaryGroups.Assault.sort(compareTonnage);

                // fetch dropships in the jumpships
                if (planet.jumpships) {
                    planet.jumpships.forEach(function (e, i, a) {
                        nbtTransport.fetchJumpshipDetail(e, nbtIdentity.get().token, function (aJumpship) {
                            if (aJumpship.dropships) {
                                aJumpship.dropships.forEach(function (e) {
                                    nbtTransport.fetchDropshipUnitInstances(e, nbtIdentity.get().token, function (instances) {
                                        if (instances._embedded) {
                                            e.combatUnitInstances = makeUnitInstanceSummary(instances._embedded.combatUnitInstances);
                                        }
                                    });
                                });
                            }

                            $timeout(function () {
                                a[i] = aJumpship;
                            }, 0);
                        });
                    });
                }

                // fetch dropship details
                if (planet.dropships) {
                    planet.dropships.forEach(function (e, i, a) {
                        nbtTransport.fetchDropshipUnitInstances(e, nbtIdentity.get().token, function (instances) {
                            if (instances._embedded) {
                                e.combatUnitInstances = makeUnitInstanceSummary(instances._embedded.combatUnitInstances);
                            }
                        });
                    });
                }
            }

            $scope.onDetail = function(planet) {
                $rootScope.$broadcast('planetSearchRequest', planet.name);
                $scope.planet = null;
                nbtPlanet.fetchPlanet(planet, nbtIdentity.get().token, function(aPlanet) {
                    $scope.planet = aPlanet;
                    processPlanet($scope.planet);
                });
            };

            $scope.onBack = function() {
                $scope.planet = null;
            };

            $scope.onPurchase = function(planet) {
                nbtPlanet.investIndustry(planet, $scope.industryPurchase, nbtIdentity.get().token,
                    function(aData) {
                        setOperationStatus("Upgrade Request Successful", true);
                    },
                    function(aErr) {
                        setOperationStatus("Upgrade Request Failed: " + aErr.message, false);
                    }
                )
            };

            // TODO: don't tie this to a specific dialog...
            $("#cmdClosePlanetsDialog").on("click", function(event) {
                $scope.show = false;
                $scope.$apply();
            });

            // when the user clicks the Faction Tools "Planets" menu item...
            var cb = $scope.$on('cmdPlanets', function (event, command) {
                // only load the jumpships if we are opening
                if (!$scope.show) {
                    $scope.planets = null;
                    reloadPlanets();
                }

                $scope.show = true;
            });
            $scope.$on('destroy', cb);

            // when the user chooses a different league, we want to update out cached league
            cb = $scope.$on('nbtFactionChanged', function(event, faction) {
                $scope.faction = faction;
                reloadPlanets();
            });
            $scope.$on('destroy', cb);

            // when the user logs in or out
            cb = $scope.$on('nbtIdentityChanged', function(event, identity) {
                $scope.identity = identity;
            });
            $scope.$on('destroy', cb);

            $scope.$watch('nameFilter', function(newValue, oldValue) {
                // filter out planets whose name does not begin with newValue
                var filtered = [];

                $scope.planets.forEach(function(e) {
                    if (e.name.startsWith(newValue))
                        filtered.push(e);
                });

                $scope.filteredPlanets = filtered;
            });

            $scope.checkEnterKey = checkEnterKeyAndSubmit;
        }]);
})();
