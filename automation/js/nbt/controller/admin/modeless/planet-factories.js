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
        .controller('PlanetFactoriesController', ['$sce', '$scope', '$rootScope', '$timeout', 'nbtPlanet', 'nbtFaction', 'nbtCombat', 'nbtIdentity', function($sce, $scope, $rootScope, $timeout, nbtPlanet, nbtFaction, nbtCombat, nbtIdentity) {
            $scope.league = null;
            $scope.planet = null;
            $scope.factories = null;
            $scope.filteredFactories = null;
            $scope.factions = null;
            $scope.combatUnits = null;
            $scope.isAdmin = false;

            // these are used for the "faction admin" data set
            $scope.factionFactories = null;
            $scope.factionPlanets = null;
            $scope.faction = null;

            var temp = null;

            // load allied factory visibility from settings, if present
            $scope.showAlliedFactories = (localStorage.showAlliedFactories && localStorage.showAlliedFactories === 'true');

            function setOperationStatus(message, success) {
                setStatusWithTimeout($scope, $timeout, message, success, 5000);
            }

            var promise = null;
            function appendOperationStatus(message) {
                if (promise) $timeout.cancel(promise);

                if (!$scope.errorMessages)
                    $scope.errorMessages = [];

                $scope.errorMessages.push(message);

                promise = $timeout(function() {
                    $scope.errorMessages = null;
                }, 5000);
            }

            function reloadFactionFactories() {
                $scope.factionFactories = null;

                if (!$scope.faction)
                    return;

                nbtFaction.fetchFactories($scope.faction, nbtIdentity.get().token, function(aFactories) {
                    $timeout(function() {
                        $scope.factionFactories = aFactories._embedded.factories;
                        refreshListing();
                    }, 0, true);
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

            function reloadFactionPlanets() {
                nbtFaction.fetchPlanets($scope.faction, nbtIdentity.get().token, function(aPlanets) {
                    $scope.factionPlanets = aPlanets._embedded.planets;
                });
            }

            function alliedFactoryFilter(f) {
                if (f.owner.id === $scope.faction.id)
                    return true;

                return $scope.showAlliedFactories;
            }

            function refreshListing() {
                // first, skip this all if we are not showing
                if (!$scope.show)
                    return;

                // then, if a planet is selected, the listing should be the factories on that planet only
                $timeout(function() {
                    if ($scope.planet && $scope.factionFactories) {
                        var factoryList = [];
                        $scope.factionFactories.forEach(function(f) {
                            if (f.planet.id === $scope.planet.id) {
                                factoryList.push(f);
                            }
                        });

                        $scope.factoryList = factoryList;
                    } else {
                        $scope.factoryList = $scope.factionFactories;
                    }

                    $scope.filteredFactories = $scope.factoryList.filter(alliedFactoryFilter);
                }, 0, true);
            }

            function removeFactory(factory) {
                // remove this factory from the faction listing
                var idx = $scope.factionFactories.findIndex(function(e, i, a) {
                    if (e.id === factory.id)
                        return i;
                });

                if (idx >= 0) {
                    $scope.factionFactories.splice(idx, 1);
                    refreshListing();
                }
            }

            function recalculateTotal() {
                $scope.total = 0;
                $scope.factionFactories.forEach(function(e,i,a) {
                    if (e.purchaseQty)
                        $scope.total += e.currentCost * e.purchaseQty;
                });
            }

            $scope.onQuantityChange = function() {
                recalculateTotal();
            };

            $scope.onPlanetClicked = function(planet) {
                // call out to the starmap to relocate to this sector capital
                $rootScope.$broadcast('planetSearchRequest', planet.name);
            };

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
                        removeFactory(factory);
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
                            $scope.factoryList = $scope.factories;
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

            $scope.onPurchase = function() {
                // present the user with one last chance to abort; if they do not, then submit an order to each factory in turn.
                if (!confirm("Are you sure you want to submit factory order(s)\n" +
                        "totaling " + $scope.total + " c-bills?")) {
                    return;
                }

                $scope.factionFactories.forEach(function(e,i,a) {
                    if (e.purchaseQty) {
                        nbtFaction.submitFactoryOrder(e, e.purchaseQty, nbtIdentity.get().token,
                            function(aData) {
                                // it succeeded, there is at least the one
                                var order = aData;

                                e.queueDepth = order.factory.queueDepth;
                                e.stockLevel = order.factory.stockLevel;
                                e.operationSuccess = true;
                                e.purchaseQty = null;

                                // make the extra class go away after two seconds
                                $timeout(function() {
                                    e.operationSuccess = null;
                                }, 2000);
                            },
                            function(aErr) {
                                e.operationFailure = true;
                                appendOperationStatus(aErr.message);

                                // make the extra class go away after two seconds
                                $timeout(function() {
                                    e.operationFailure = null;
                                }, 2000);
                            }
                        );
                    }
                });
            };

            // TODO: don't tie this to a specific dialog...
            $("#cmdClosePlanetFactoriesDialog").on("click", function(event) {
                if ($scope.factionFactories)
                    $scope.factionFactories.forEach(function(e,i,a) {
                        e.purchaseQty = null;
                    });
                $scope.show = false;
                $scope.$apply();
            });

            // when the user clicks the Faction Tools "Jumpships" menu item...
            var cb = $scope.$on('cmdEditFactories', function (event, command) {
                $scope.show = true;
                refreshListing();
            });
            $scope.$on('destroy', cb);

            // when the user chooses a different planet, we want to update our cached planet
            cb = $scope.$on('planetChanged', function(event, planet) {
                $scope.planet = planet;
                refreshListing();
            });
            $scope.$on('destroy', cb);

            // when the user chooses a different planet, we want to update our cached planet
            cb = $scope.$on('nbtFactionChanged', function(event, faction) {
                $scope.faction = faction;
                reloadFactionFactories();
                reloadFactionPlanets();
            });
            $scope.$on('destroy', cb);

            // when the user chooses a different league, we want to update our cached league
            cb = $scope.$on('nbtLeagueChanged', function(event, league) {
                $scope.league = league;
                reloadFactions();
                reloadCombatUnits();
            });
            $scope.$on('destroy', cb);

            function initializeIdent(ident) {
                $scope.isAdmin = (ident.isSiteAdmin() || ident.isLeagueAdmin());
            }

            $scope.$watch('faction', function(newVal, oldVal) {
                reloadFactionFactories();
            });

            $scope.$watch('showAlliedFactories', function(newVal, oldVal) {
                localStorage.showAlliedFactories = newVal;

                if ($scope.factoryList)
                    $scope.filteredFactories = $scope.factoryList.filter(alliedFactoryFilter);
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
