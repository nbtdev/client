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

(function() {
    var mod = angular.module('nbt.starmapDetail', []);

    mod.directive('starmapDetail', function($templateRequest, $compile) {

        this.controller = function($scope, $attrs, $http, $sce) {
            var self = this;
            var token = null;

            this.updatePlanetBattleDetail = function(data) {
                var battleData = data.data;
                $scope.battleId = battleData.id;
                $scope.battleAttacker = battleData.primaryAttacker;
                $scope.battleType = battleData.type;
                $scope.battleLaunched = battleData.attackDate;
            }

            this.updatePlanet = function(data) {
                var p = data.data;
                $scope.name = p.name;

                //if (p.description.length > 0)
                //    $scope.description = $sce.trustAsHtml(p.description);

                //$scope.owner = p.ownerName;
                //$scope.terrain = p.terrain;
                //$scope.recharge = p.rechargeTime;
                //$scope.industry = p.industry;
                //$scope.chargeStation = p.chargeStation;
                //$scope.capital = p.capitalPlanet;
                //$scope.factory = p.factory;

                // if there is an active battle on the planet, follow the link and get the details
                //if (p.battleId) {
                //    $http({
                //        url: p._links.battle.href,
                //        method: 'GET',
                //        headers: {'X-NBT-Token': token === null ? '' : token}
                //    }).then(self.updatePlanetBattleDetail);
                //    $scope.isBattle = true;
                //}

                // if there is/are a factory/factories on the planet, follow the link and get the details
            };

            this.setPlanet = function(aPlanet, aPlanets, aToken) {
                $scope.planets = aPlanets;

                if (aPlanet === null) {
                    self.clear();
                    $scope.$apply();
                } else {
                    $scope.name = '';

                    token = aToken;

                    $http({
                        url: aPlanet._links.self.href,
                        method: 'GET',
                        headers: {'X-NBT-Token': aToken === null ? '' : aToken}
                    }).then(self.updatePlanet);
                }
            };

            this.hasPlanets = function() {
                if ($scope.planets)
                    return $scope.planets.length > 0;

                return false;
            };

            this.clear = function() {
                $scope.name = '';
            };
        };

        return {
            restrict: 'E',
            scope: true,
            controller: controller,
            controllerAs: 'detail',
            link: function(scope, element, attrs, controller) {
                var i18n = 'en';

                if (attrs.lang) i18n = attrs.lang;

                $templateRequest('/templates/' + i18n + '/starmap/starmapDetail.html').then(function(html) {
                    var templ = angular.element(html);
                    element.append(templ);
                    $compile(templ)(scope);
                });

                element[0].onplanetchanged = function(
                    aPlanet,  // the selected planet
                    aPlanets, // all other planets within 60LY
                    aToken    // security token (null if none)
                ) {
                    controller.setPlanet(aPlanet, aPlanets, aToken);
                }

                element[0].clear = function() {
                    controller.clear();
                }
            }
        };
    });
})();
