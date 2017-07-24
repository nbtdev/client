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
        .controller('JumpshipSummaryController', ['$sce', '$scope', 'nbtTransport', 'nbtIdentity', function($sce, $scope, nbtTransport, nbtIdentity) {
            var self = this;

            var clear = function() {
                $scope.jumpships = [];
                $scope.totalAssault = 0;
                $scope.totalHeavy = 0;
                $scope.totalMedium = 0;
                $scope.totalLight = 0;
            };

            var recalculateTotals = function(aJumpships) {
                for (var i=0; i<aJumpships.length; ++i) {
                    var js = aJumpships[i];

                    if (!js.dropships)
                        continue;

                    for (var j=0; j<js.dropships.length; ++j) {
                        var ds = js.dropships[j];

                        if (!ds.combatUnits)
                            continue;

                        for (var k=0; k<ds.combatUnits.length; ++k) {
                            var cu = ds.combatUnits[k];
                        }
                    }
                }
            };

            var cbJumpshipsLoaded = $scope.$on('jumpshipsLoaded', function (event, aJumpships) {
                clear();
                $scope.jumpships = aJumpships;

                recalculateTotals(aJumpships);
            });
            $scope.$on('destroy', cbJumpshipsLoaded);

            var cbSelectedPlanetChanged = $scope.$on('planetChanged', function (event, aPlanet) {
                clear();
            });
            $scope.$on('destroy', cbSelectedPlanetChanged);

            clear();
        }]);
})();
