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
        .controller('JumpController', ['$sce', '$scope', '$timeout', 'nbtPlanet', 'nbtTransport', 'nbtIdentity', function($sce, $scope, $timeout, nbtPlanet, nbtTransport, nbtIdentity) {
            var self = this;

            $scope.planet = null;

            $scope.showJump = false;

            $scope.jumpships = [];
            $scope.jumpTypes = [];
            $scope.jumpActions = [];

            $scope.selectedJumpships = [];
            $scope.selectedJumpType = null;
            $scope.selectedJumpAction = null;

            $scope.message = null;
            $scope.msgIsError = false;

            // Step 1: Select jumpship(s) to jump
            // Step 2: Select type of jump to make (normal, merc contract, etc)
            // Step 3: Select jump action (pass-through, attack. etc)
            // Step 4: Select destination planet
            // Step 5: Perform the jump

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

            var reset = function() {
                $scope.jumpships = [];
                $scope.jumpTypes = [];
                $scope.jumpActions = [];

                $scope.selectedJumpships = [];
                $scope.selectedJumpType = null;
                $scope.selectedJumpAction = null;

                $scope.message = null;
                $scope.msgIsError = false;
            };

            $scope.onExecuteJump = function() {
                var jumpships = [];
                for (var i=0; i<$scope.selectedJumpships.length; ++i) {
                    jumpships.push(JSON.parse($scope.selectedJumpships[i]));
                }

                var path = [];

                var jumpType = JSON.parse($scope.selectedJumpType);
                var jumpAction = JSON.parse($scope.selectedJumpAction);

                nbtTransport.jumpJumpships(
                    path,
                    jumpships,
                    jumpType,
                    jumpAction,
                    nbtIdentity.get().token,

                    function(data) {
                        updateStatus("Jump successful");
                    },

                    function(err) {
                        updateStatus(err, true);
                    }
                );
            };

            var cbSelectedPlanetChanged = $scope.$on('planetChanged', function (event, aPlanet) {
                $scope.planet = aPlanet;
                reset();

                if (aPlanet === null)
                    return;

                $scope.showJump = true; // temp

                // grab all jumpships at the planet
                nbtTransport.fetchJumpshipsForPlanet(aPlanet, nbtIdentity.get().token, function(data) {
                    $scope.jumpships = data;
                });

                // grab the types of jumps allowed for this user, with this planet as the origin
                nbtTransport.fetchJumpTypesFromPlanet(aPlanet, nbtIdentity.get().token, function(data) {
                    $scope.jumpTypes = data;
                });

                // grab the jump actions allowed for this user, with this planet as the origin
                nbtTransport.fetchJumpActionsFromPlanet(aPlanet, nbtIdentity.get().token, function(data) {
                    $scope.jumpActions = data;
                });
            });
            $scope.$on('destroy', cbSelectedPlanetChanged);

            // on the starmap, the user can select a path between planets; we want to know when
            // such a path has been selected. The path is a an ordered list of planets, from the origin
            // to the destination.
            var cbJumpPathChanged = $scope.$on('jumpPathChanged', function (event, aPath) {
                $scope.jumpPath = aPath;
                $showJump = true;
            });
            $scope.$on('destroy', cbJumpPathChanged);
        }]);
})();
