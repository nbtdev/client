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
        .controller('DropshipDockController', ['$sce', '$scope', '$timeout', 'nbtPlanet', 'nbtTransport', 'nbtIdentity', function($sce, $scope, $timeout, nbtPlanet, nbtTransport, nbtIdentity) {
            var self = this;

            $scope.planet = null;
            $scope.message = null;
            $scope.msgIsError = false;

            $scope.planetDropships = [];
            $scope.jumpshipDropships = {};
            $scope.selectedPlanetDropships = [];
            $scope.selectedJumpshipDropships = {};

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

            $scope.onUndockDropships = function(jumpship) {
                if ($scope.planet === null)
                    return;

                // else, populate the dropship list...
                var dropships = [];
                var jumpshipDropships = $scope.selectedJumpshipDropships[jumpship.id];

                for (var i=0; i<jumpshipDropships.length; ++i) {
                    dropships.push(JSON.parse(jumpshipDropships[i]));
                }

                nbtTransport.undockDropships(
                    $scope.planet,
                    dropships,
                    jumpship,
                    nbtIdentity.get().token,

                    // success callback
                    function(data) {
                        $scope.planetDropships = [];

                        if (data.planetState) {
                            for (var i = 0; i < data.planetState.length; ++i) {
                                var ds = data.planetState[i];
                                $scope.planetDropships.push(ds);
                            }
                        }

                        $scope.jumpshipDropships[jumpship.id] = data.jumpshipState;

                        updateStatus("Dropship(s) successfully undocked");
                        $scope.selectedJumpshipDropships[jumpship.id] = [];
                    },

                    // failure callback
                    function(err) {
                        updateStatus(err.data.message, true);
                    }
                );
            };

            $scope.onDockDropships = function(jumpship) {
                if ($scope.planet === null)
                    return;

                // else, populate the dropship list...
                var dropships = [];

                for (var i=0; i<$scope.selectedPlanetDropships.length; ++i) {
                    dropships.push(JSON.parse($scope.selectedPlanetDropships[i]));
                }

                nbtTransport.dockDropships(
                    $scope.planet,
                    dropships,
                    jumpship,
                    nbtIdentity.get().token,

                    // success callback
                    function(data) {
                        $scope.planetDropships = [];

                        if (data.planetState) {
                            for (var i = 0; i < data.planetState.length; ++i) {
                                var ds = data.planetState[i];
                                $scope.planetDropships.push(ds);
                            }
                        }

                        $scope.jumpshipDropships[jumpship.id] = data.jumpshipState;

                        updateStatus("Dropship(s) successfully docked");
                        $scope.selectedPlanetDropships = [];
                    },

                    // failure callback
                    function(err) {
                        updateStatus(err.data.message, true);
                    }
                );
            };

            var cbSelectedPlanetChanged = $scope.$on('planetChanged', function (event, aPlanet) {
                $scope.planet = aPlanet;

                if (aPlanet === null)
                    return;

                // else, populate the dropship list(s)...
                nbtTransport.fetchJumpshipsForPlanet(aPlanet, nbtIdentity.get().token, function(data) {
                    $scope.jumpships = data;
                    $scope.jumpshipDropships = {};

                    for (var i=0; i<data.length; ++i) {
                        var js = data[i];
                        $scope.jumpshipDropships[js.id] = [];

                        if (js.dropships) {
                            for (var j=0; j<js.dropships.length; ++j) {
                                $scope.jumpshipDropships[js.id].push(js.dropships[j]);
                            }
                        }
                    }
                });

                // grab any dropships on the planet too
                nbtTransport.fetchDropshipsForPlanet(aPlanet, nbtIdentity.get().token, function(data) {
                    $scope.planetDropships = data;
                });
            });
            $scope.$on('destroy', cbSelectedPlanetChanged);

        }]);
})();
