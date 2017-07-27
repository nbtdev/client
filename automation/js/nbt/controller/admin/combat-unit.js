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
        .controller('CombatUnitAdminController', ['$sce', '$scope', 'nbtCombat', 'nbtIdentity', function($sce, $scope, nbtCombat, nbtIdentity) {
            $scope.league = null;
            $scope.data = null;
            $scope.unitTypes = null;
            $scope.newUnit = null;
            $scope.message = null;
            $scope.success = null;

            // when editing, we want to save off the old values in case we need to restore
            // them on a cancel
            var temp = null;

            function processCombatUnits(aData) {
                $scope.data = aData;
                for (var i=0; i<$scope.data._embedded.combatUnits.length; ++i) {
                    var t = $scope.data._embedded.combatUnits[i];
                    if ($scope.league.id === t.leagueId)
                        t.enabledInLeague = true;
                }

                // fetch the unit types too
                nbtCombat.fetchCombatUnitTypes($scope.league, nbtIdentity.get().token, function(aData) {
                    $scope.unitTypes = aData._embedded.combatUnitTypes;
                })
            }

            var timeoutPromise = null;

            function setStatus(message, success) {
                $scope.message = message;
                $scope.success = success;

                // cause the message to go away in 5 seconds
                if (timeoutPromise)
                    $timeout.cancel(timeoutPromise);

                timeoutPromise = $timeout(function() {
                    $scope.message = null;
                    timeoutPromise = null;
                }, 5000);
            }

            var reloadCombatUnits = function() {
                nbtCombat.fetchCombatUnits($scope.league, nbtIdentity.get().token, function(aData) {
                    processCombatUnits(aData);
                });
            };

            $("#combatUnitAdminModal").on("shown.bs.modal", function() {
                reloadCombatUnits();
            });

            $scope.onAdd = function() {
                $scope.newUnit = {
                    enabledInLeague: true,
                    name: null,
                    designation: null,
                    type: { id: null },
                    battleValue: null,
                    tonnage: null,
                    editing: true,
                    isNew: true,
                    _links: {
                        self: $scope.data._links.self
                    }
                }
            };

            $scope.onEdit = function(unit) {
                unit.editing = true;

                // save off the current editable values
                temp = {
                    name: unit.name,
                    leagueId: unit.leagueId,
                    type: {
                        id: unit.type.id,
                        name: unit.type.name
                    },
                    battleValue: unit.battleValue,
                    tonnage: unit.tonnage
                };
            };

            $scope.onDelete = function(unit) {
                nbtCombat.deleteCombatUnit(
                    unit,
                    nbtIdentity.get().token,
                    function(aData) {
                        reloadCombatUnits();
                        setStatus("Combat unit successfully deleted", true);
                    },
                    function(aErr) {
                        setStatus(aErr.data.message, false);
                    }
                );
            };

            $scope.onApply= function(unit) {
                if (unit.isNew) {
                    nbtCombat.addCombatUnit(
                        unit,
                        nbtIdentity.get().token,
                        function(aData) {
                            processCombatUnits(aData);
                            setStatus("Combat unit successfully added", true);
                            delete unit.editing;
                            delete unit.isNew;
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                } else {
                    nbtCombat.updateCombatUnit(
                        unit,
                        nbtIdentity.get().token,
                        function(aData) {
                            setStatus("Type successfully updated", true);
                            delete unit.editing;
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                }
            };

            $scope.onCancel = function(unit) {
                delete unit.editing;
                delete unit.isNew;

                // restore the previous values
                unit.leagueId = temp.leagueId;
                unit.name = temp.name;
                unit.type = temp.type;
                unit.battleValue = temp.battleValue;
                unit.tonnage = temp.tonnage;
            };

            // when the user chooses a different league, we want to update our cached league
            var cb = $scope.$on('nbtLeagueChanged', function(event, league) {
                $scope.league = league;
            });
            $scope.$on('destroy', cb);
        }]);
})();
