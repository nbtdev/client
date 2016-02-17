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

            $scope.planet = null;

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
                $scope.owner = p.ownerName;
                $scope.chargeStation = p.chargeStation;
                $scope.capital = p.capitalPlanet;
                $scope.factory = p.factory;

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

            var mNearest = null;
            this.setPlanet = function(aPlanet, aPlanets, aToken) {
                $scope.planet = aPlanet;
                $scope.planets = aPlanets;
                $scope.name = null;
                $scope.owner = null;
                $scope.factory = false;
                $scope.chargeStation = false;
                $scope.capital = false;

                $scope.planets.sort(function(p1, p2) {
                    return p1.radius - p2.radius;
                });

                var idx = $scope.planets.findIndex(function(elem, i, arr) {
                    return (this.id === elem.planet.id);
                }, aPlanet);

                $scope.planets.splice(idx, 1);

                if (aPlanet === null) {
                    self.clear();
                    $scope.$apply();
                } else {
                    $http({
                        url: aPlanet._links.self.href,
                        method: 'GET',
                        headers: {'X-NBT-Token': aToken === null ? '' : aToken}
                    }).then(self.updatePlanet);
                }

                // go through aPlanets and list the nearest for each faction
                var nearest = {};
                for (var i=0; i<aPlanets.length; ++i) {
                    var p = aPlanets[i];
                    var v = nearest[p.planet.ownerName];

                    if (v) {
                        if (v.radius > p.radius)
                            nearest[p.planet.ownerName] = v;
                    } else
                        nearest[p.planet.ownerName] = p;
                }

                self.mNearest = nearest;
            };

            this.hasPlanets = function() {
                if ($scope.planets)
                    return $scope.planets.length > 0;

                return false;
            };

            this.clear = function() {
                $scope.planet = null;
                $scope.planets = null;
                $scope.name = null;
                $scope.owner = null;
                $scope.factory = false;
                $scope.chargeStation = false;
                $scope.capital = false;
            };

            this.canJump = function(planet) {
                if (planet && $scope.planet) {
                    // easy one -- all planets within 30LY
                    if (planet.radius <= 30.0)
                        return true;

                    // less easy -- any planet over 30, but less than 60, so long as
                    // (a) it's allied or owned, or
                    if (planet.planet.ownerName === $scope.planet.ownerName)
                        return true;
                    
                    // (b) it is not allied, and is the closest planet for that faction
                    //     that does not already have one inside 30LY
                    var ne = self.mNearest[planet.planet.ownerName];
                    if (ne.planet.id === planet.planet.id)
                        return true;
                }

                return false;
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
