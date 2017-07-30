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
        .controller('PlanetSetupController', ['$sce', '$scope', 'nbtFaction', 'nbtLeague', 'nbtIdentity', function($sce, $scope, nbtFaction, nbtLeague, nbtIdentity) {
            $scope.show = false;
            $scope.league = null;
            $scope.planetSetup = null;

            function transformInstancesToTotals() {
                $scope.totals = [];

                var dict = {};
                for (var i=0; i<$scope.planetSetup.instances.length; ++i) {
                    var inst = $scope.planetSetup.instances[i];

                    var entry = dict[inst.template.id];
                    if (!entry) {
                        entry = {
                            count: 0,
                            template: inst.template
                        };
                        dict[inst.template.id] = entry;
                    }

                    entry.count++;
                }

                $scope.planetSetup.combatUnitSummary = dict;
            }

            function transformTotalsToInstances() {
                // first, blow away the existing instances
                $scope.planetSetup.instances.length = 0;
                Object.keys($scope.planetSetup.combatUnitSummary).forEach(function(key, index) {
                    var obj = this[key];
                    for (var i=0; i<obj.count; ++i) {
                        $scope.planetSetup.instances.push({
                            template: obj.template
                        });
                    }
                }, $scope.planetSetup.combatUnitSummary);
            }

            function processFactionSetupData(aData) {
                $scope.factionSetup = aData;

                // make a dictionary of the per-planet data so it's easy to access
                $scope.planetSetupDict = {};
                for (var i=0; i<$scope.factionSetup.data.length; ++i) {
                    var setup = $scope.factionSetup.data[i];
                    $scope.planetSetupDict[setup.planetId] = setup;
                    $scope.baseValues = {
                        industryRemaining: $scope.factionSetup.industryLimitRemaining,
                        combatUnitRemaining: $scope.factionSetup.combatUnitLimitRemaining,
                        dropshipRemaining: $scope.factionSetup.dropshipLimitRemaining,
                        jumpshipRemaining: $scope.factionSetup.jumpshipLimitRemaining
                    };
                }
            }

            $scope.onSave = function() {
                if ($scope.faction) {
                    transformTotalsToInstances();
                    nbtFaction.submitFactionSetup($scope.faction, $scope.factionSetup, nbtIdentity.get().token, function(aData) {
                        processFactionSetupData(aData);
                    },
                    function(aErr) {
                        console.log(aErr.data.message);
                    });
                }
            };

            $(".nbt-close-dialog").on("click", function(event) {
                $scope.show = false;
                $scope.$apply();
            });

            var cb = $scope.$on('planetChanged', function (event, aPlanet) {
                // before we move off of this planet, make sure we save any changes that were made
                if ($scope.planetSetup)
                    transformTotalsToInstances();

                $scope.planet = null;
                $scope.planetSetup = null;

                if (aPlanet) {
                    if (aPlanet.parentGroup.owner.id === $scope.faction.id) {
                        $scope.planet = aPlanet;
                        $scope.planetSetup = $scope.planetSetupDict[aPlanet.id];

                        // convert the instance list to a summary total dictionary
                        transformInstancesToTotals();
                    }
                }

                $scope.$apply();
            });
            $scope.$on('destroy', cb);

            cb = $scope.$on('nbtFactionChanged', function (event, faction) {
                $scope.faction = faction;

                // ask for the setup data for this faction
                nbtFaction.fetchFactionSetup(faction, nbtIdentity.get().token, function(aData) {
                    processFactionSetupData(aData);
                });
            });
            $scope.$on('destroy', cb);

            cb = $scope.$on('cmdPlanetSetup', function (event, command) {
                $scope.show = true;
                $scope.$apply();
            });
            $scope.$on('destroy', cb);
        }]);
})();
