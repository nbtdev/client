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
        .controller('RosterController', ['$sce', '$scope', '$timeout', 'nbtFaction', 'nbtIdentity', function($sce, $scope, $timeout, nbtFaction, nbtIdentity) {
            $scope.faction = null;
            $scope.roster = null;
            var temp = null;

            function setOperationStatus(message, success) {
                setStatusWithTimeout($scope, $timeout, message, success, 5000);
            }

            function reloadRoster() {
                nbtFaction.fetchRoster($scope.faction, nbtIdentity.get().token, function(aRoster) {
                    $scope.roster = aRoster._embedded.pilots;
                });
            }

            $scope.onAdd = function() {
                $scope.newPilot = {
                    name: null,
                    editing: true,
                    isNew: true
                }
            };

            $scope.onEdit = function(pilot) {
                temp = {};
                shallowCopy(temp, pilot);
                pilot.editing = true;
            };

            $scope.onDelete = function(pilot) {
                if (!confirm("Are you sure you want to delete pilot '" + pilot.name + "'?"))
                    return;

                nbtFaction.removePilotFromRoster(
                    pilot,
                    nbtIdentity.get().token,
                    function(aData) {
                        reloadRoster();
                        setOperationStatus("Pilot successfully deleted", true);
                    },
                    function(aErr) {
                        setStatus(aErr.data.message, false);
                    }
                );
            };

            $scope.onApply = function(pilot) {
                if (pilot.isNew) {
                    // parse this into a list of pilot names, delimited on newline
                    var names = pilot.name.split('\n');
                    var data = [];

                    for (var i=0; i<names.length; ++i) {
                        data.push({name: names[i]});
                    }

                    nbtFaction.addPilotsToRoster(
                        $scope.faction,
                        data,
                        nbtIdentity.get().token,
                        function(aData) {
                            $scope.roster = aData._embedded.pilots;
                            setOperationStatus("Pilot(s) successfully added", true);
                            pilot.editing = false;
                            pilot.isNew = false;
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                } else {
                    nbtFaction.updateRosterPilot(
                        pilot,
                        nbtIdentity.get().token,
                        function(aData) {
                            setOperationStatus("Pilot successfully updated", true);
                            temp = {};
                            $scope.onCancel(pilot);
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                }
            };

            $scope.onCancel = function(pilot) {
                pilot.editing = false;
                pilot.isNew = false;

                // restore the previous values
                shallowCopy(pilot, temp);
            };

            // when the user chooses a different league, we want to update out cached league
            var cb = $scope.$on('nbtFactionChanged', function(event, faction) {
                $scope.faction = faction;
                reloadRoster();
            });
            $scope.$on('destroy', cb);
        }]);
})();
