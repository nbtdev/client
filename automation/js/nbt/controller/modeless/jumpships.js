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
        .controller('JumpshipsController', ['$sce', '$scope', '$timeout', '$rootScope', 'nbtTransport', 'nbtIdentity', function($sce, $scope, $timeout, $rootScope, nbtTransport, nbtIdentity) {
            $scope.faction = null;
            $scope.jumpships = null;
            $scope.identity = null;
            var temp = null;

            function setOperationStatus(message, success) {
                setStatusWithTimeout($scope, $timeout, message, success, 5000);
            }

            function reloadJumpships() {
                nbtTransport.fetchJumpshipsForFaction($scope.faction, nbtIdentity.get().token, function(aJumpships) {
                    $scope.jumpships = aJumpships._embedded.jumpships;

                    // when users click on a planet link in the jumpship listing, we want to trigger a camera move
                    // on the starmap to that planet; in order to get these bindings to happen after the next digest,
                    // we put a zero timeout in the queue to perform this
                    $timeout(function() {
                        $("#jumpshipsDialog a").on("click", onPlanetClicked);
                    }, 0);
                });
            }

            $scope.onAdd = function() {
                $scope.newJumpship = {
                    name: null,
                    editing: true,
                    isNew: true
                }
            };

            $scope.onEdit = function(jumpship) {
                temp = {};
                shallowCopy(temp, jumpship);
                jumpship.editing = true;
            };

            $scope.onDelete = function(jumpship) {
                if (!confirm("Are you sure you want to delete jumpship '" + jumpship.name + "'?"))
                    return;

                nbtTransport.deleteJumpship(
                    $scope.faction,
                    jumpship,
                    nbtIdentity.get().token,
                    function(aData) {
                        reloadJumpships();
                        setOperationStatus("Jumpship successfully deleted", true);
                    },
                    function(aErr) {
                        setStatus(aErr.data.message, false);
                    }
                );
            };

            $scope.onApply = function(jumpship) {
                if (jumpship.isNew) {
                    nbtTransport.addNewJumpship(
                        jumpship,
                        $scope.faction,
                        nbtIdentity.get().token,
                        function(aData) {
                            $scope.jumpships = aData._embedded.jumpships;
                            setStatus("Jumpship successfully added", true);
                            jumpship.editing = false;
                            jumpship.isNew = false;
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                } else {
                    nbtTransport.updateJumpship(
                        jumpship,
                        nbtIdentity.get().token,
                        function(aData) {
                            setOperationStatus("Jumpship successfully updated", true);
                            temp = {};
                            $scope.onCancel(jumpship);
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                }
            };

            $scope.onCancel = function(jumpship) {
                jumpship.editing = false;
                jumpship.isNew = false;

                // restore the previous values
                shallowCopy(jumpship, temp);
            };

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

                list.sort(function(a, b) {
                    return a.tonnage - b.tonnage;
                });

                return list;
            }

            $scope.onDetail = function(jumpship) {
                nbtTransport.fetchJumpshipDetail(jumpship, nbtIdentity.get().token, function(aData) {
                    $scope.jumpship = aData;

                    // fetch information about combat units on dropships
                    if (aData.dropships) {
                        aData.dropships.forEach(function (e) {
                            nbtTransport.fetchDropshipUnitInstances(e, nbtIdentity.get().token, function (instances) {
                                if (instances._embedded) {
                                    e.combatUnitInstances = makeUnitInstanceSummary(instances._embedded.combatUnitInstances);
                                }
                            })
                        });
                    }
                });
            };

            $scope.onBack = function() {
                $scope.jumpship = null;
            };

            function onPlanetClicked(event) {
                $rootScope.$broadcast('planetSearchRequest', event.currentTarget.innerHTML);
            }

            // TODO: don't tie this to a specific dialog...
            $("#cmdCloseJumpshipsDialog").on("click", function(event) {
                $scope.show = false;
                $scope.$apply();
            });

            // when the user clicks the Faction Tools "Jumpships" menu item...
            var cb = $scope.$on('cmdJumpships', function (event, command) {
                // only load the jumpships if we are opening
                if (!$scope.show) {
                    $scope.jumpships = null;
                    reloadJumpships();
                }

                $scope.show = true;
            });
            $scope.$on('destroy', cb);

            // when the user chooses a different league, we want to update out cached league
            cb = $scope.$on('nbtFactionChanged', function(event, faction) {
                $scope.faction = faction;
            });
            $scope.$on('destroy', cb);

            // when the user logs in or out
            cb = $scope.$on('nbtIdentityChanged', function(event, identity) {
                $scope.identity = identity;
            });
            $scope.$on('destroy', cb);

            $scope.checkEnterKey = checkEnterKeyAndSubmit;
        }]);
})();
