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
        .controller('DropshipsController', ['$sce', '$scope', '$timeout', '$rootScope', 'nbtTransport', 'nbtIdentity', function($sce, $scope, $timeout, $rootScope, nbtTransport, nbtIdentity) {
            $scope.faction = null;
            $scope.dropships = null;
            $scope.identity = null;
            $scope.showAlliedDropships = false;
            $scope.filteredDropships = [];
            var temp = null;

            function setOperationStatus(message, success) {
                setStatusWithTimeout($scope, $timeout, message, success, 5000);
            }

            function reloadDropships() {
                $scope.reloading = true;
                nbtTransport.fetchDropshipsForFaction($scope.faction, nbtIdentity.get().token, function(aDropships) {
                    $scope.dropships = aDropships._embedded.dropships;
                    filterDropshipListing();

                    // when users click on a planet link in the jumpship listing, we want to trigger a camera move
                    // on the starmap to that planet; in order to get these bindings to happen after the next digest,
                    // we put a zero timeout in the queue to perform this
                    $timeout(function() {
                        $("#dropshipsDialog a").on("click", onPlanetClicked);
                    }, 0);

                    $scope.reloading = false;
                }, function(aErr) {
                    $scope.reloading = false;
                });
            }

            $scope.onAdd = function() {
                $scope.newDropship = {
                    name: null,
                    editing: true,
                    isNew: true
                }
            };

            $scope.onEdit = function(dropship) {
                temp = {};
                shallowCopy(temp, dropship);
                dropship.editing = true;
            };

            $scope.onDelete = function(dropship) {
                if (!confirm("Are you sure you want to delete dropship '" + dropship.name + "'?"))
                    return;

                nbtTransport.deleteDropship(
                    $scope.faction,
                    dropship,
                    nbtIdentity.get().token,
                    function(aData) {
                        reloadDropships();
                        setOperationStatus("Dropship successfully deleted", true);
                    },
                    function(aErr) {
                        setStatus(aErr.data.message, false);
                    }
                );
            };

            $scope.onApply = function(dropship) {
                if (dropship.isNew) {
                    nbtTransport.addNewDropship(
                        dropship,
                        $scope.faction,
                        nbtIdentity.get().token,
                        function(aData) {
                            $scope.dropships = aData._embedded.dropships;
                            setStatus("Dropship successfully added", true);
                            dropship.editing = false;
                            dropship.isNew = false;
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                } else {
                    nbtTransport.updateDropship(
                        dropship,
                        nbtIdentity.get().token,
                        function(aData) {
                            setOperationStatus("Dropship successfully updated", true);
                            temp = {};
                            $scope.onCancel(dropship);
                        },
                        function(aErr) {
                            setStatus(aErr.data.message, false);
                        }
                    );
                }
            };

            $scope.onCancel = function(dropship) {
                dropship.editing = false;
                dropship.isNew = false;

                // restore the previous values
                shallowCopy(dropship, temp);
            };

            function onPlanetClicked(event) {
                $rootScope.$broadcast('planetSearchRequest', event.currentTarget.innerHTML);
            }

            $scope.onJumpshipClick = function(dropship) {
                $rootScope.$broadcast('planetSearchRequest', dropship.jumpship.planet.name);
            };

            $scope.onRefresh = function() {
                reloadDropships();
            };

            // TODO: don't tie this to a specific dialog...
            $("#cmdCloseDropshipsDialog").on("click", function(event) {
                $scope.show = false;
                $scope.$apply();
            });

            function filterDropshipListing() {
                $scope.filteredDropships = [];

                if (!$scope.dropships)
                    return;

                $scope.dropships.forEach(function(e) {
                    if (!$scope.showAlliedDropships && e.owner.id !== $scope.faction.id)
                        return;

                    $scope.filteredDropships.push(e);
                });
            }

            $scope.$watch('showAlliedDropships', function(newValue, oldValue) {
                filterDropshipListing();
            });

            // when the user clicks the Faction Tools "Jumpships" menu item...
            var cb = $scope.$on('cmdDropships', function (event, command) {
                // only load the jumpships if we are opening
                if (!$scope.show) {
                    $scope.dropships = null;
                    reloadDropships();
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
