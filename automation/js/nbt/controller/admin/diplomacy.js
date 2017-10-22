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
        .controller('DiplomacyAdminController', ['$sce', '$scope', '$timeout', 'nbtFaction', 'nbtLeague', 'nbtIdentity', function($sce, $scope, $timeout, nbtFaction, nbtLeague, nbtIdentity) {
            $scope.league = null;
            $scope.faction = null;
            $scope.factions = null;
            $scope.diplomacy = null;
            $scope.newEntry = null;

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

            $scope.onReload = function() {
                $scope.diplomacy = null;
                nbtFaction.fetchDiplomacyData($scope.faction, nbtIdentity.get().token, function(data) {
                    $scope.diplomacy = data._embedded.alliances;
                });
            };

            $scope.onEdit = function(entry) {
                entry.editing = true;
                entry.prevVal = entry.level;
            };

            $scope.onCancel = function(entry) {
                if (!entry.newEntry) {
                    entry.level = entry.prevVal;
                    delete entry.prevVal;
                } else {
                    var idx = $scope.diplomacy.findIndex(function(e,i,a) {
                        return e.newEntry;
                    });

                    $scope.diplomacy.splice(idx, 1);

                    delete entry.newEntry;
                }

                delete entry.editing;
            };

            $scope.onAdd = function() {
                var entry = {
                    ally: null,
                    level: 0,
                    effectiveDate: Date.now(),
                    newEntry: true,
                    editing: true
                };

                $scope.diplomacy.push(entry);
            };

            // apply a single entry, either updating existing one or inserting a new one
            $scope.onApply = function(entry) {
                nbtFaction.updateDiplomacyData($scope.faction, entry, nbtIdentity.get().token, function(data) {
                    entry.operationSuccess = true;
                    entry.editing = null;
                    entry.newEntry = null;

                    // make the extra class go away after two seconds
                    $timeout(function() {
                        entry.operationSuccess = null;
                        $scope.diplomacy = data._embedded.alliances;
                    }, 2000);
                }, function (err) {
                    entry.operationFailure = true;
                    appendOperationStatus(err.message);

                    // make the extra class go away after two seconds
                    $timeout(function() {
                        entry.operationFailure = null;
                    }, 2000);
                });
            };

            // when the user chooses a different league, we want to update out cached league
            var cb = $scope.$on('nbtLeagueChanged', function(event, league) {
                $scope.league = league;
                nbtFaction.fetchFactionsForLeague(league, nbtIdentity.get().token, function(factions) {
                    $scope.factions = factions;
                });
            });
            $scope.$on('destroy', cb);

            $scope.$watch('faction', function(newValue, oldValue) {
                if (!newValue)
                    return;

                $scope.onReload();
            });
        }]);
})();
