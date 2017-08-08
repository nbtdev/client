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
        .controller('FactionAdminController', ['$sce', '$scope', '$timeout', 'nbtFaction', 'nbtIdentity', function($sce, $scope, $timeout, nbtFaction, nbtIdentity) {
            $scope.league = null;
            $scope.factions = null;
            $scope.factionClasses = null;
            $scope.factionStatuses = null;
            $scope.message = null;
            $scope.success = null;

            // when editing, we want to save off the old values in case we need to restore
            // them on a cancel
            var temp = null;

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

            var reloadFactions = function() {
                nbtFaction.fetchFactionsForLeague($scope.league, nbtIdentity.get().token, function(aData) {
                    // set up the inverse of 'hidden' on each faction
                    for (var i=0; i<aData.length; ++i) {
                        aData[i].visible = true;

                        if (aData[i].hidden)
                            aData[i].visible = !aData[i].hidden;
                    }

                    $scope.factions = aData;
                });
            };

            $("#factionAdminModal").on("shown.bs.modal", function() {
                reloadFactions();
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

            function shallowCopy(dest, src) {
                // save off the current editable values; just shallow-copy the first level of property values
                Object.keys(src).forEach(function(k) {
                    // skip anything that starts with $
                    if (k.charAt(0)==='$')
                        return;

                    dest[k] = this[k];
                }, src);
            }

            $scope.onEdit = function(faction) {
                temp = {};
                shallowCopy(temp, faction);
                faction.editing = true;
            };

            $scope.onDelete = function(faction) {
                if (!confirm("Are you sure you want to delete faction '" + faction.displayName + "'?"))
                    return;

                nbtFaction.deleteFaction(
                    faction,
                    nbtIdentity.get().token,
                    function(aData) {
                        reloadFactions();
                        setStatus("Faction successfully deleted", true);
                    },
                    function(aErr) {
                        setStatus(aErr.data.message, false);
                    }
                );
            };

            $scope.onApply = function(faction) {
                var logoElem = $('#factionLogo' + faction.id)[0];
                var iconElem = $('#factionIcon' + faction.id)[0];

                if (faction.isNew) {
                    nbtFaction.addFaction(
                        faction,
                        nbtIdentity.get().token,
                        function(aData) {
                            $scope.factions = aData;
                            setStatus("Faction successfully added", true);
                            faction.editing = false;
                            faction.isNew = false;
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                } else {
                    faction.hidden = !faction.visible;

                    nbtFaction.updateFaction(
                        faction,
                        nbtIdentity.get().token,
                        function(aData) {
                            setStatus("Faction successfully updated", true);
                            temp = {};
                            $scope.onCancel(faction);
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                }
            };

            $scope.onCancel = function(faction) {
                faction.editing = false;
                faction.isNew = false;

                // restore the previous values
                shallowCopy(faction, temp);
            };

            // when the user chooses a different league, we want to update our cached league
            var cb = $scope.$on('nbtLeagueChanged', function(event, league) {
                $scope.league = league;
            });
            $scope.$on('destroy', cb);

            // when the faction service updates its list of faction classes, we want to know
            cb = $scope.$on('nbtFactionClassesChanged', function(event, classes) {
                $scope.factionClasses = classes._embedded.factionClasses;
                for (var i=0; i<$scope.factionClasses.length; ++i)
                    delete $scope.factionClasses[i]._links;
            });
            $scope.$on('destroy', cb);

            // likewise, when the faction service updates its list of faction statuses, we want to know
            cb = $scope.$on('nbtFactionStatusesChanged', function(event, statuses) {
                $scope.factionStatuses = statuses._embedded.factionStatuses;
                for (var i=0; i<$scope.factionStatuses.length; ++i)
                    delete $scope.factionStatuses[i]._links;
            });
            $scope.$on('destroy', cb);
        }]);
})();
