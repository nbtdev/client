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
        .controller('PlanetFactoriesController', ['$sce', '$scope', '$timeout', 'nbtPlanet', 'nbtFaction', 'nbtCombat', 'nbtIdentity', function($sce, $scope, $timeout, nbtPlanet, nbtFaction, nbtCombat, nbtIdentity) {
            $scope.league = null;
            $scope.planet = null;
            $scope.factories = null;
            $scope.factions = null;
            $scope.combatUnits = null;
            $scope.isAdmin = false;

            // these are used for the "faction admin" data set
            $scope.factionFactories = null;
            $scope.factionPlanets = null;
            $scope.faction = null;

            var temp = null;

            function setOperationStatus(message, success) {
                setStatusWithTimeout($scope, $timeout, message, success, 5000);
            }

            function reloadPlanetFactories() {
                if (!$scope.planet) {
                    reloadFactionFactories();
                }

                $scope.factories = null;
                $scope.factionFactories = null;
                $scope.factionPlanets = null;
                $scope.factoryList = null;
                nbtPlanet.fetchFactories($scope.planet, nbtIdentity.get().token, function(aFactories) {
                    $timeout(function() {
                        $scope.factories = aFactories._embedded.factories;
                        $scope.factoryList = $scope.factories;
                    }, 0, true);
                });
            }

            function reloadFactionFactories() {
                $scope.factories = null;
                $scope.factionFactories = null;
                $scope.factionPlanets = null;
                $scope.factoryList = null;

                nbtFaction.fetchFactories($scope.faction, nbtIdentity.get().token, function(aFactories) {
                    $timeout(function() {
                        $scope.factionFactories = aFactories._embedded.factories;
                        $scope.factoryList = $scope.factionFactories;
                    }, 0, true);
                });

                nbtFaction.fetchPlanets($scope.faction, nbtIdentity.get().token, function(aPlanets) {
                    $scope.factionPlanets = aPlanets._embedded.planets;
                });
            }

            function reloadCombatUnits() {
                nbtCombat.fetchCombatUnits($scope.league, nbtIdentity.get().token, function(aUnits) {
                    $scope.combatUnits = aUnits._embedded.combatUnits;
                });
            }

            function reloadFactions() {
                nbtFaction.fetchFactionsForLeague($scope.league, nbtIdentity.get().token, function(aFactions) {
                    $scope.factions = aFactions;
                });
            }

            $scope.onAdd = function() {
                $scope.newFactory = {
                    firm: null,
                    baseRate: 3,
                    maxRate: 25,
                    editing: true,
                    isNew: true
                }
            };

            $scope.onEdit = function(factory) {
                temp = {};
                shallowCopy(temp, factory);
                factory.editing = true;
            };

            $scope.onDelete = function(factory) {
                if (!confirm("Are you sure you want to delete factory '" + factory.firm + "'?"))
                    return;

                nbtPlanet.deleteFactory(
                    factory,
                    nbtIdentity.get().token,
                    function(aData) {
                        reloadPlanetFactories();
                        setOperationStatus("Factory successfully deleted", true);
                    },
                    function(aErr) {
                        setOperationStatus(aErr.message, false);
                    }
                );
            };

            $scope.onApply = function(factory) {
                if (factory.isNew) {
                    nbtPlanet.addFactory(
                        $scope.planet,
                        factory,
                        nbtIdentity.get().token,
                        function(aData) {
                            $scope.factories = aData._embedded.factories;
                            setOperationStatus("Factory successfully added", true);
                            factory.editing = false;
                            factory.isNew = false;
                        },
                        function(aErr) {
                            setOperationStatus(aErr.message, false);
                        }
                    );
                } else {
                    nbtPlanet.updateFactory(
                        factory,
                        nbtIdentity.get().token,
                        function(aData) {
                            setOperationStatus("Factory successfully updated", true);
                            temp = {};
                            $scope.onCancel(factory);
                        },
                        function(aErr) {
                            setOperationStatus(aErr.message, false);
                        }
                    );
                }
            };

            $scope.onCancel = function(factory) {
                factory.editing = false;
                factory.isNew = false;

                // restore the previous values
                shallowCopy(factory, temp);
            };

            // TODO: don't tie this to a specific dialog...
            $("#cmdClosePlanetFactoriesDialog").on("click", function(event) {
                $scope.show = false;
                $scope.$apply();
            });

            // when the user clicks the Faction Tools "Jumpships" menu item...
            var cb = $scope.$on('cmdEditFactories', function (event, command) {
                // only load the factories if we are opening
                $scope.factories = null;
                reloadPlanetFactories();

                $scope.show = true;
            });
            $scope.$on('destroy', cb);

            // when the user chooses a different planet, we want to update our cached planet
            cb = $scope.$on('planetChanged', function(event, planet) {
                $timeout(function() {
                    $scope.planet = planet;
                    reloadPlanetFactories();
                }, 0, true);
            });
            $scope.$on('destroy', cb);

            // when the user chooses a different planet, we want to update our cached planet
            cb = $scope.$on('nbtFactionChanged', function(event, faction) {
                $scope.faction = faction;
                reloadFactionFactories();
            });
            $scope.$on('destroy', cb);

            // when the user chooses a different league, we want to update our cached league
            cb = $scope.$on('nbtLeagueChanged', function(event, league) {
                $scope.league = league;
                reloadCombatUnits();
                reloadFactions();
            });
            $scope.$on('destroy', cb);

            function initializeIdent(ident) {
                $scope.isAdmin = (ident.isSiteAdmin() || ident.isLeagueAdmin());
            }

            $scope.$watch('faction', function(oldVal, newVal) {
                reloadFactionFactories();
            });

            // when the user signs in or out, we want to know
            cb = $scope.$on('nbtIdentityChanged', function(event, ident) {
                initializeIdent(ident);
                if (!ident.isValid())
                    $scope.show = false;
            });
            $scope.$on('destroy', cb);

            initializeIdent(nbtIdentity.get());
            $scope.checkEnterKey = checkEnterKeyAndSubmit;
        }]);
})();
