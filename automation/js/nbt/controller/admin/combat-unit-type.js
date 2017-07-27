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
        .controller('CombatUnitTypeAdminController', ['$sce', '$scope', 'nbtCombat', 'nbtIdentity', function($sce, $scope, nbtCombat, nbtIdentity) {
            $scope.league = null;
            $scope.combatUnitTypes = null;
            $scope.newType = null;

            function processCombatUnitTypes(aData) {
                $scope.combatUnitTypes = aData;
                for (var i=0; i<$scope.combatUnitTypes._embedded.length; ++i) {
                    var t = $scope.combatUnitTypes._embedded[i];
                    if ($scope.league.id === t.leagueId)
                        t.enabledInLeague = true;
                }
            }

            function setStatus(message, success) {
                $scope.message = message;
                $scope.success = success;
            }

            var reloadCombatUnitTypes = function() {
                nbtCombat.fetchCombatUnitTypes($scope.league, nbtIdentity.get().token, function(aData) {
                    processCombatUnitTypes(aData);
                });
            };

            $("#combatUnitTypeAdminModal").on("shown.bs.modal", function() {
                reloadCombatUnitTypes();
            });

            $scope.onAdd = function() {
                $scope.newType = {
                    enabledInLeague: true,
                    name: null,
                    abbrev: null,
                    editing: true,
                    isNew: true,
                    _links: {
                        self: $scope.combatUnitTypes._links.self
                    }
                }
            };

            $scope.onEdit = function(type) {
                type.editing = true;
            };

            $scope.onDelete = function(type) {
                nbtCombat.deleteCombatUnitType(
                    type,
                    nbtIdentity.get().token,
                    function(aData) {
                        reloadCombatUnitTypes();
                        setStatus("Type successfully deleted", true);
                    },
                    function(aErr) {
                        setStatus(aErr.data.message, false);
                    }
                );
            };

            $scope.onApply= function(type) {
                if (type.isNew) {
                    nbtCombat.addCombatUnitType(
                        type,
                        nbtIdentity.get().token,
                        function(aData) {
                            processCombatUnitTypes(aData);
                            setStatus("Type successfully added", true);
                            delete type.editing;
                            delete type.isNew;
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                } else {
                    nbtCombat.updateCombatUnitType(
                        type,
                        nbtIdentity.get().token,
                        function(aData) {
                            setStatus("Type successfully updated", true);
                            delete type.editing;
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                }
            };

            $scope.onCancel = function(type) {
                delete type.editing;
                delete type.isNew;
            };

            // when the user chooses a different league, we want to update our cached league
            var cb = $scope.$on('nbtLeagueChanged', function(event, league) {
                $scope.league = league;

                if ($scope.combatUnitTypes) {
                    reloadCombatUnitTypes();
                }
            });
            $scope.$on('destroy', cb);
        }]);
})();
