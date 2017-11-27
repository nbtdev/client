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
        .controller('BattlePlanetController', ['$sce', '$scope', 'nbtBattle', 'nbtPlanet', 'nbtIdentity', function($sce, $scope, nbtBattle, nbtPlanet, nbtIdentity) {
            $scope.battle = null;
            $scope.sector = null;

            $scope.onSubmit = function() {
                var planetIds = $("#battlePlanetOrder").sortable("toArray");

                // convert this into something that looks like an array of Planet objects
                var planets = [];
                for (var i=0; i<planetIds.length; ++i) {
                    planets.push({id: planetIds[i]});
                }

                // post that to the service, to initialize the battle
                $scope.message = null;
                nbtBattle.initializeBattle($scope.battle, planets, nbtIdentity.get().token,
                    function(aBattle) {
                        $('#battlePlanetSelectModal').modal('hide');
                        $scope.battle = aBattle;
                        $scope.message = null;
                    },
                    function(aErr) {
                        $scope.message = aErr;
                    }
                );
            };

            // fired from the Battle listing, this means the user wants to initialize the battle
            var cb = $scope.$on('nbtBattlePlanetsRequested', function(event, battle) {
                $scope.battle = battle;
                nbtPlanet.fetchSectorDetail(battle.sector, nbtIdentity.get().token, function(sector) {
                    $scope.sector = sector;
                });

                $('#battlePlanetSelectModal').modal('show');
            });
            $scope.$on('destroy', cb);
        }]);
})();
