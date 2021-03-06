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
        .controller('TransferCombatUnitController', ['$sce', '$scope', '$timeout', 'nbtPlanet', 'nbtTransport', 'nbtCombat', 'nbtIdentity', function($sce, $scope, $timeout, nbtPlanet, nbtTransport, nbtCombat, nbtIdentity) {
            $scope.typeTree = {};

            function buildTypeTree(typeData) {
                var types = typeData._embedded.combatUnitTypes;

                // iterate twice - first to get all entries in, second to patch up parentage
                for (var i=0; i<types.length; ++i) {
                    var type = types[i];
                    $scope.typeTree[type.id] = type;
                }

                for (var i=0; i<types.length; ++i) {
                    var type = types[i];
                    if (type.parentType)
                        type.parentType = $scope.typeTree[type.parentType.id];
                    else
                        type.parentType = null;
                }
            }

            /**
             * Return true if type is a subtype of targetType, false otherwise
             * @param type
             * @param targetType
             */
            function isA(type, targetType) {
                // first, find type in the tree
                var entry = $scope.typeTree[type.id];

                while (entry && entry.id !== targetType.id)
                    entry = entry.parentType;

                return entry !== null;
            }

            function compareByTonnageThenName(a, b) {
                if (a.template.tonnage !== b.template.tonnage)
                    return a.template.tonnage - b.template.tonnage;

                if (a.template.name < b.template.name) return -1;
                else if (a.template.name > b.template.name) return 1;
                else return 0;
            }

            $scope.planet = null;
            $scope.combatUnits = [];
            $scope.dropships = [];
            $scope.message = null;
            $scope.msgIsError = false;
            $scope.selectedPlanetCombatUnits = [];
            $scope.selectedDropshipCombatUnits = {};

            var timeoutPromise = null;

            var updateStatus = function(message, isError) {
                $scope.message = message;
                $scope.msgIsError = isError;

                // cause the message to go away in 5 seconds
                if (timeoutPromise)
                    $timeout.cancel(timeoutPromise);

                timeoutPromise = $timeout(function() {
                    $scope.message = null;
                    timeoutPromise = null;
                }, 5000);
            };

            function updateAvailability(dropship) {
                // for each type of unit that this dropship can carry, calculate how much
                // space is remaining on the dropship for units of that type
                var capacities = {};
                for (var c=0; c<dropship.type.capacities.length; ++c) {
                    var capacity = dropship.type.capacities[c];
                    capacities[capacity.combatUnitType.id] = capacity;

                    // reset the count to zero
                    capacity.available = capacity.capacity;
                }

                // now, go through the instances and reduce by one for each instance of a given type
                if (dropship.combatUnitInstances) {
                    for (var i = 0; i < dropship.combatUnitInstances.length; ++i) {
                        var inst = dropship.combatUnitInstances[i];

                        // this may be a subtype, so we have to check the type tree for a match
                        // against the capacity types
                        Object.keys(capacities).forEach(function(key) {
                            var capacity = this[key];
                            if (isA(inst.template.type, capacity.combatUnitType)) {
                                capacity.available--;
                                return true;
                            }
                        }, capacities);
                    }
                }
            }

            $scope.onTransferDropshipToPlanet = function(dropship) {
                if ($scope.planet === null)
                    return;

                // else, populate the combat unit list with combat units...
                var units = [];
                var originUnits = $scope.selectedDropshipCombatUnits[dropship.id];

                for (var i=0; i<originUnits.length; ++i) {
                    units.push(JSON.parse(originUnits[i]));
                }

                nbtTransport.transferCombatUnitsDropshipToPlanet(
                    $scope.planet,
                    units,
                    dropship,
                    nbtIdentity.get().token,

                    // success callback
                    function(data) {
                        $scope.combatUnits = [];

                        if (data.destinationState) {
                            for (var i = 0; i < data.destinationState.length; ++i) {
                                var unit = data.destinationState[i];
                                $scope.combatUnits.push({
                                    id: unit.id,
                                    ownerName: unit.owner.displayName,
                                    ownerAbbr: unit.owner.shortName,
                                    template: unit.template
                                });
                            }

                            if ($scope.combatUnits)
                                $scope.combatUnits.sort(compareByTonnageThenName);
                        }

                        $scope.dropshipCombatUnits[dropship.id] = data.originState;
                        dropship.combatUnitInstances = data.originState;

                        if (dropship.combatUnitInstances)
                            dropship.combatUnitInstances.sort(compareByTonnageThenName);

                        updateStatus("Transfer Succeeded");
                        updateAvailability(dropship);
                    },

                    // failure callback
                    function(err) {
                        updateStatus(err.data.message, true);
                    }
                );
            };

            $scope.onTransferPlanetToDropship = function(dropship) {
                if ($scope.planet === null)
                    return;

                // else, populate the combat unit list with combat units...
                var units = [];

                for (var i=0; i<$scope.selectedPlanetCombatUnits.length; ++i) {
                    units.push(JSON.parse($scope.selectedPlanetCombatUnits[i]));
                }

                nbtTransport.transferCombatUnitsPlanetToDropship(
                    $scope.planet,
                    units,
                    dropship,
                    nbtIdentity.get().token,

                    // success callback
                    function(data) {
                        $scope.combatUnits = [];

                        if (data.originState) {
                            for (var i = 0; i < data.originState.length; ++i) {
                                var unit = data.originState[i];
                                $scope.combatUnits.push({
                                    id: unit.id,
                                    ownerName: unit.owner.displayName,
                                    ownerAbbr: unit.owner.shortName,
                                    template: unit.template
                                });
                            }

                            if ($scope.combatUnits)
                                $scope.combatUnits.sort(compareByTonnageThenName);
                        }

                        $scope.dropshipCombatUnits[dropship.id] = data.destinationState;
                        dropship.combatUnitInstances = data.destinationState;

                        if (dropship.combatUnitInstances)
                            dropship.combatUnitInstances.sort(compareByTonnageThenName);

                        updateStatus("Transfer Succeeded");
                        updateAvailability(dropship);
                    },

                    // failure callback
                    function(err) {
                        updateStatus(err.data.message, true);
                    }
                );
            };

            var cbLeagueChanged = $scope.$on('nbtLeagueChanged', function (event, aLeague) {
                nbtCombat.fetchCombatUnitTypes(aLeague, nbtIdentity.get().token, function(aData) {
                    // set up type hierarchy
                    buildTypeTree(aData);
                });
            });
            $scope.$on('destroy', cbLeagueChanged);

            var cbSelectedPlanetChanged = $scope.$on('planetChanged', function (event, aPlanet) {
                $scope.planet = aPlanet;

                if (aPlanet === null)
                    return;

                // else, populate the combat unit list with combat units...
                $scope.combatUnits = [];
                nbtPlanet.fetchCombatUnitsOnPlanet(aPlanet, nbtIdentity.get().token, function(data) {
                    for (var i=0; i<data.length; ++i) {
                        var unit = data[i];
                        $scope.combatUnits.push({
                            id: unit.id,
                            ownerName: unit.owner.displayName,
                            ownerAbbr: unit.owner.shortName,
                            template: unit.template
                        });
                    }

                    if ($scope.combatUnits)
                        $scope.combatUnits.sort(compareByTonnageThenName);
                });

                // grab any dropships on the planet too
                nbtTransport.fetchDropshipsForPlanet(aPlanet, nbtIdentity.get().token, function(data) {
                    $scope.dropships = data;
                    $scope.dropshipCombatUnits = {};

                    // make an entry in the scope for each dropship combat unit list
                    for (var i=0; i<data.length; ++i) {
                        var ds = data[i];
                        if (ds.combatUnitInstances)
                            ds.combatUnitInstances.sort(compareByTonnageThenName);

                        $scope.dropshipCombatUnits[ds.id] = ds.combatUnitInstances;
                        $scope.selectedDropshipCombatUnits[ds.id] = [];
                        updateAvailability(ds);
                    }
                });
            });
            $scope.$on('destroy', cbSelectedPlanetChanged);

        }]);
})();
