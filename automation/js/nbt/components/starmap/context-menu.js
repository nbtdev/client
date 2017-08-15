/**
 Copyright (c) 2016, Netbattletech
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

// context menu controller
(function() {
    angular
        .module('nbt.app')
        .controller('StarmapContextMenuController', ['$sce', '$scope', '$rootScope', '$timeout', 'nbtPlanet', 'nbtIdentity', function($sce, $scope, $rootScope, $timeout, nbtPlanet, nbtIdentity) {
            $scope.planet = null;

            $timeout(function() {
                var menuItems = $('.nbt-ctx-menu-item');
                menuItems.on('click', function(e) {
                    var cmd = e.currentTarget.dataset.cmd;

                    if (cmd === 'cmdToggleCS') {
                        // handle it here...
                        if ($scope.planet.chargeStation)
                            $scope.planet.chargeStation = !$scope.planet.chargeStation;
                        else
                            $scope.planet.chargeStation = true;

                        nbtPlanet.updatePlanet(
                            { id: $scope.planet.id, chargeStation: $scope.planet.chargeStation },
                            nbtIdentity.get().token,
                            function(aPlanet) {
                                // NOP
                            }, function(aErr) {
                                // reverse the change
                                $scope.planet.chargeStation = !$scope.planet.chargeStation;
                            }
                        );
                    } else {
                        $rootScope.$broadcast(cmd, $scope.planet);
                    }

                    $('#starmapContextMenu').hide();
                });
            }, 0);

            var cb = $scope.$on('planetChanged', function(event, planet) {
                $scope.planet = planet;
            });
            $scope.$on('destroy', cb);
        }]);
})();
