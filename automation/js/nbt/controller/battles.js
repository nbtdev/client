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
        .controller('BattleController', ['$sce', '$scope', '$rootScope', 'nbtBattle', 'nbtIdentity', function($sce, $scope, $rootScope, nbtBattle, nbtIdentity) {
            $scope.league = null;
            $scope.faction = null;
            $scope.battles = null;
            $scope.all = true;
            $scope.active = true;

            function processBattles() {
                // go through the battles and add a 'ready' property to each
                for (var i=0; i<$scope.battles.length; ++i) {
                    var battle = $scope.battles[i];
                    battle.ready = (battle._links.ready &&
                        ($scope.faction.id === battle.attacker.id && battle.attackerReady ||
                         $scope.faction.id === battle.sector.owner.id && battle.defenderReady)
                    );
                }
            }

            $("#battlesModal").on("shown.bs.modal", function() {
                $scope.battles = null;
                reloadBattles();
            });

            function reloadBattles() {
                $scope.battles = null;

                if ($scope.all) {
                    nbtBattle.fetchBattlesForLeague($scope.league, $scope.active, nbtIdentity.get().token, function(aData) {
                        if (aData._embedded) {
                            $scope.battles = aData._embedded.sectorBattles;
                            processBattles();
                        }
                    });
                } else {
                    nbtBattle.fetchBattlesForFaction($scope.faction, $scope.active, nbtIdentity.get().token, function(aData) {
                        if (aData._embedded) {
                            $scope.battles = aData._embedded.sectorBattles;
                            processBattles();
                        }
                    });
                }
            }

            $scope.report = function(battle) {
                nbtBattle.fetchBattleDetail(battle, nbtIdentity.get().token);
            };

            $scope.initialize = function(battle) {
                nbtBattle.requestBattlePlanets(battle);
            };

            $scope.onSectorClicked = function(sector) {
                // call out to the starmap to relocate to this sector capital
                $rootScope.$broadcast('planetSearchRequest', sector.name);
            };

            $scope.readyUp = function(battle) {
                if (!battle.ready) {
                    if (!confirm("WARNING!\n\nContinue only if you have ensured that both your faction, and any allies you plan to include in this battle, " +
                            "have landed and offloaded all combat forces you intend to bring, and that you are ready to enter full battle lockdown.")) {
                        return;
                    }
                }

                nbtBattle.toggleBattleReady(battle, nbtIdentity.get().token, function(battle) {
                    reloadBattles();
                });
            };

            $scope.reset = function(battle) {
                nbtBattle.resetBattle(battle, nbtIdentity.get().token, function() {
                    reloadBattles();
                });
            };

            $scope.$watch('active', function(newVal, oldVal) {
                reloadBattles();
            });

            // notify us of faction changes/loads
            var cb = $scope.$on('nbtFactionChanged', function (event, faction) {
                $scope.faction = faction;
                $scope.all = false;
            });
            $scope.$on('destroy', cb);

            // notify us of faction changes/loads
            cb = $scope.$on('nbtLeagueChanged', function (event, league) {
                $scope.league = league;
                $scope.all = true;
            });
            $scope.$on('destroy', cb);
        }]);
})();
