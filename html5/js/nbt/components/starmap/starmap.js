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
    var mod = angular.module('nbt.starmap', []);

    mod.directive('starmap', function($compile) {

        this.controller = function($scope, $attrs, $http, $rootScope) {
            var mStarmapDebug;
            try { mStarmapDebug = starmapDebug; } catch (e) { mStarmapDebug = false; }

            var self = this;
            this.text = "(not set)";
            this.token = null;
            this.planetsUrl = null;

            $scope.showPlanetBrief = false;

            // planet data from service
            this.planets = null;

            // quadtree to reduce overdraw
            this.quadtree = null;

            // per-faction map colors
            this.mapColors = null;

            // starmap width and height (from parent size)
            this.width = 0;
            this.height = 0;

            this.onMapColorData = function(data) {

                // convert the returned object to a hashtable
                self.mapColors = {};
                for (var i=0; i<data.data._embedded.mapColors.length; ++i) {
                    var mc = data.data._embedded.mapColors[i];
                    self.mapColors[mc.factionName] = mc;
                }

                // finally, reset the map
                self.reloadStarmapData();
            }

            this.succeed = function(data) {
                self.text = data;
                self.planets = data.data;

                // get the "bounding area" of all of the planets
                var minX = Infinity;
                var minY = Infinity;
                var maxX = -Infinity;
                var maxY = -Infinity;

                for (var i=0; i<self.planets._embedded.planets.length; ++i) {
                    var p = self.planets._embedded.planets[i];
                    if (p.x < minX) minX = p.x;
                    if (p.x > maxX) maxX = p.x;
                    if (p.y < minY) minY = p.y;
                    if (p.y > maxY) maxY = p.y;
                }

                // create quadtree with dimensions specified in the data
                self.quadtree = new QuadTree({left: minX, right: maxX, top: maxY, bottom: minY});

                // ...aaaaaaand now go through planets again to insert them into the quadtree
                for (var i=0; i<self.planets._embedded.planets.length; ++i) {
                    var p = self.planets._embedded.planets[i];
                    self.quadtree.insert(p);
                }

                // fetch map color data
                $http({
                    method: 'GET',
                    url: self.planets._links.mapColors.href
                })
                    .then(self.onMapColorData, self.fail);
            };

            this.fail = function(msg) {
                self.text = "Failed: " + msg.statusText;
            };

            this.fetchPlanets = function() {
                $http({
                        url: self.planetsUrl,
                        method: "GET",
                        headers: {'X-NBT-Token': self.token}
                })
                .then(self.succeed, self.fail);
            };

            this.setSize = function(w, h) {
                self.width = w;
                self.height = h;

                if (self.gl) {
                    self.gl.setSize(w, h);
                    self.camera3D.left = self.width / -2;
                    self.camera3D.right = self.width / 2;
                    self.camera3D.top = self.height / 2;
                    self.camera3D.bottom = self.height / -2;
                    self.camera3D.updateProjectionMatrix();
                    self.gl.render(self.scene3D, self.camera3D);
                }
            }

            this.setOverlays = function(aText, aUI) {
                this.overlay = aText;
                this.ui = aUI;
            }

            // WebGL (3D, three.js) objects
            this.gl = null;
            this.scene3D = null;
            this.camera3D = null;

            // 30- and 60-LY rings
            this.rings3060 = null

            // mouse manipulation state
            this.mapZoom = 1.0;

            // TODO: figure out how to do enums for this
            // 1: move map
            this.state = 0;

            this.lastX = 0;
            this.lastY = 0;

            // when the map is moved, these track the virtual "offset" from the starting location
            // (used for placing text in the overlay)
            this.offsetX = 0;
            this.offsetY = 0;

            // text overlay
            this.overlay = null;

            // UI overlay
            this.ui = null;

            // for hovering over planets to see info
            this.hoverPlanet = null;
            this.hoverPlanetTimeout = null;
            this.hoverPlanetLoc = null;
            this.hoverPlanetBrief = null;

            // initialize the 2D (for text overlays and GUI) and 3D (for starmap itself) objects
            this.initializeGraphics = function(parent) {
                // create WebGL renderer, scene and camera
                self.gl = new THREE.WebGLRenderer();
                self.gl.setSize(self.width, self.height);

                self.scene3D = new THREE.Scene();

                self.camera3D = new THREE.OrthographicCamera(
                    self.width / -2,
                    self.width / 2,
                    self.height / 2,
                    self.height / -2,
                    1,
                    100
                );

                self.camera3D.position.x = 0;
                self.camera3D.position.y = 0;
                self.camera3D.position.z = 1;
                self.camera3D.zoom = self.mapZoom;

                self.scene3D.add(self.camera3D);

                self.gl.domElement.style.zIndex = 1;
                parent.append(self.gl.domElement);

                // create the 30- and 60-LY rings
                self.rings3060 = new THREE.Object3D();
                var ring30 = new THREE.RingGeometry(29.9, 30.1, 90);
                var ring60 = new THREE.RingGeometry(59.9, 60.1, 120);
                var whtMtl = new THREE.MeshBasicMaterial();
                whtMtl.color.setRGB(1,1,1);
                var grnMtl = new THREE.MeshBasicMaterial();
                grnMtl.color.setRGB(0,1,0);
                self.rings3060.add(new THREE.Mesh(ring30, whtMtl));
                self.rings3060.add(new THREE.Mesh(ring60, grnMtl));

                // add mouse event handlers
                self.gl.domElement.addEventListener('mousewheel', self.onMouseWheel);
                self.gl.domElement.addEventListener('mousedown', self.onMouseDown);
                self.gl.domElement.addEventListener('mouseup', self.onMouseUp);
                self.gl.domElement.addEventListener('mousemove', self.onMouseMove);
                self.gl.domElement.addEventListener('mouseleave', self.onMouseExit);
                window.addEventListener('resize', self.onWindowResized);
            };

            this.onWindowResized = function(event) {
                var w = self.gl.domElement.parentElement.offsetWidth;
                var h = self.gl.domElement.parentElement.offsetHeight;
                self.setSize(w, h);
            }

            var addRing = function(planet, innerRadius, outerRadius, material) {
                var ringGeom = new THREE.RingGeometry(innerRadius, outerRadius, 36);
                var ringMesh = new THREE.Mesh(ringGeom, material);
                var ringObj = new THREE.Object3D();
                ringObj.add(ringMesh);
                ringObj.position.set(planet.x, planet.y, 0);
                self.scene3D.add(ringObj);
            };

            this.reloadStarmapData = function() {
                var whiteMtl = new THREE.MeshBasicMaterial();
                whiteMtl.color.setRGB(1,1,1);
                var yellowMtl = new THREE.MeshBasicMaterial();
                yellowMtl.color.setRGB(1,1,0);
                var redMtl = new THREE.MeshBasicMaterial();
                redMtl.color.setRGB(1,0,0);
                var greenMtl = new THREE.MeshBasicMaterial();
                greenMtl.color.setRGB(0,1,0);
                var blueMtl = new THREE.MeshBasicMaterial();
                blueMtl.color.setRGB(0,0,1);
                var magentaMtl = new THREE.MeshBasicMaterial();
                magentaMtl.color.setRGB(1,0,1);

                self.scene3D = new THREE.Scene();
                self.scene3D.add(self.camera3D);

                // plow through the planets, making objects, geometries and meshes along the way
                for (var i = 0; i < self.planets._embedded.planets.length; ++i) {
                    var p = self.planets._embedded.planets[i];
                    var x = p.x;
                    var y = p.y;
                    var name = p.name;

                    var geom = new THREE.CircleGeometry(1, 18);
                    var mtl = new THREE.MeshBasicMaterial();
                    var mc = self.mapColors[p.ownerName];
                    var color = (mc.planetColor.red << 16) | (mc.planetColor.green << 8) | (mc.planetColor.blue << 0);
                    mtl.color.set(color);

                    var mesh = new THREE.Mesh(geom, mtl);
                    var obj = new THREE.Object3D();
                    obj.add(mesh);
                    obj.userData = p;

                    obj.position.set(x, y, 0);

                    self.scene3D.add(obj);

                    // add rings for various other properties
                    if (p.capitalPlanet) addRing(p, 1.5, 1.7, magentaMtl);
                    if (p.chargeStation) addRing(p, 1.8, 2.0, yellowMtl);
                    if (p.factory) addRing(p, 2.1, 2.3, whiteMtl);
                    if (p.battleId) addRing(p, 2.4, 2.6, redMtl);
                }

                self.gl.render(self.scene3D, self.camera3D);
            };

            this.onPlanetSelected = function(planet) {
                if (planet) {
                    self.rings3060.position.set(planet.x, planet.y, 0);
                    self.scene3D.add(self.rings3060);
                } else {
                    self.scene3D.remove(self.rings3060);
                }

                self.gl.render(self.scene3D, self.camera3D);
            }

            this.onMouseWheel = function(event) {
                // calculate new zoom factor
                var zoom = self.camera3D.zoom;
                zoom += event.wheelDelta / 600;

                if (zoom > 0.39 && zoom < 12.1) {
                    self.camera3D.zoom = zoom;
                    self.mapZoom = zoom;
                    self.camera3D.updateProjectionMatrix();

                    self.gl.render(self.scene3D, self.camera3D);

                    self.updateOverlay();

                    event.preventDefault();
                }

                return false;
            };

            this.onMouseDown = function(event) {
                // move the camera on middle-mouse down
                if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
                    self.lastX = event.offsetX;
                    self.lastY = event.offsetY;
                    self.state = 1;
                }

                return false;
            };

            this.onMouseUp = function(event) {
                if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
                    self.state = 0;
                } else if (event.button === 0) {
                    // then user wants to select something, find out what it is (if anything) and
                    // have something handle it
                    var vpW = self.camera3D.right - self.camera3D.left;
                    var vpH = self.camera3D.top - self.camera3D.bottom;
                    var w = vpW / self.camera3D.zoom;
                    var h = vpH / self.camera3D.zoom;
                    var l = self.offsetX - w/2;
                    var t = self.offsetY + h/2;

                    // normalized position in overlay viewport
                    var nx = event.offsetX / vpW;
                    var ny = event.offsetY / vpH;

                    var mouseX = nx * w + l;
                    var mouseY = t - ny * h;

                    var obj = null;
                    if (self.quadtree)
                        obj = self.quadtree.find(mouseX, mouseY);

                    self.onPlanetSelected(obj);

                    // get the list of planets within 60LY
                    var planets = [];

                    if (obj)
                        planets = self.quadtree.findAllWithinRadius({x:mouseX, y:mouseY}, 60.0);

                    // call out
                    $rootScope.$broadcast('planetChanged', obj, planets, self.token);
                }

                return false;
            };

            this.onMouseExit = function(event) {
                self.state = 0;

                return false;
            }

            this.onMouseMove = function(event) {
                if (self.state === 1) {
                    var dX = self.lastX - event.offsetX;
                    var dY = self.lastY - event.offsetY;

                    dX /= self.mapZoom;
                    dY /= self.mapZoom;

                    self.lastX = event.offsetX;
                    self.lastY = event.offsetY;

                    self.camera3D.position.x += dX;
                    self.camera3D.position.y -= dY;

                    self.offsetX += dX;
                    self.offsetY -= dY;

                    // draw the planet graphics
                    self.gl.render(self.scene3D, self.camera3D);

                    // update the text overlay
                    self.updateOverlay();

                    return true;
                } else {
                    // see what's under the mouse, if anything. If it's a planet
                    // then set a timeout to hover; if it's the same planet as
                    // before, do nothing; if it's nothing, clear any existing timeout
                    var vpW = self.camera3D.right - self.camera3D.left;
                    var vpH = self.camera3D.top - self.camera3D.bottom;
                    var w = vpW / self.camera3D.zoom;
                    var h = vpH / self.camera3D.zoom;
                    var l = self.offsetX - w/2;
                    var t = self.offsetY + h/2;

                    // normalized position in overlay viewport
                    var nx = event.offsetX / vpW;
                    var ny = event.offsetY / vpH;

                    var mouseX = nx * w + l;
                    var mouseY = t - ny * h;

                    var obj = null;
                    if (self.quadtree)
                        obj = self.quadtree.find(mouseX, mouseY);

                    if (obj) {
                        if (obj !== self.hoverPlanet) {
                            self.hoverPlanet = obj;

                            if (self.hoverPlanetTimeout) clearTimeout(self.hoverPlanetTimeout);

                            self.hoverPlanetLoc = {x: event.offsetX, y: event.offsetY};
                            self.hoverPlanetTimeout = setTimeout(self.showPlanetBrief, 500);
                        }
                    } else {
                        self.removePlanetBrief();
                        self.hoverPlanet = null;

                        if (self.hoverPlanetTimeout) clearTimeout(self.hoverPlanetTimeout);
                        self.hoverPlanetTimeout = null;

                        self.hoverPlanetLoc = null;
                    }
                }

                return false;
            };

            this.showPlanetBrief = function() {
                clearTimeout(self.hoverPlanetTimeout);

                // add a planet_brief element to the UI layer
                self.hoverPlanetBrief = angular.element($compile('<planet_brief></planet_brief>')($scope))[0];
                self.hoverPlanetBrief.setPlanet(self.hoverPlanet, self.token, self.hoverPlanetLoc);
                self.ui.append(self.hoverPlanetBrief);
            };

            this.removePlanetBrief = function() {
                if (self.hoverPlanetBrief) {
                    self.hoverPlanetBrief.clear();
                    self.hoverPlanetBrief.remove();
                }
            };

            // redraw the overlay text if the zoom level is beyond a certain value
            this.updateOverlay = function() {
                self.overlay.empty();

                if (self.mapZoom < 4) return;

                // which planets are visible?
                var vpW = self.camera3D.right - self.camera3D.left;
                var vpH = self.camera3D.top - self.camera3D.bottom;
                var w = vpW / self.camera3D.zoom;
                var h = vpH / self.camera3D.zoom;
                var l = self.offsetX - w/2;
                var r = self.offsetX + w/2;
                var t = self.offsetY + h/2;
                var b = self.offsetY - h/2;
                var visible = self.quadtree.findAllWithinBox(l, r, b, t);

                // draw these names upon the overlay
                for (var i=0; i<visible.length; ++i) {
                    var p = visible[i];
                    var text = angular.element("<div/>");
                    text.addClass('planetNameLabel');
                    text.text(p.name);

                    // normalized position in overlay viewport
                    var nx = (p.x - l) / w;
                    var ny = (p.y - b) / h;

                    var vpX = nx * vpW + p.xtextOffset;
                    var vpY = (1.0 - ny) * vpH + p.ytextOffset;

                    var mc = self.mapColors[p.ownerName];
                    var tc = new THREE.Color(mc.textColor.red / 255.0, mc.textColor.green / 255.0, mc.textColor.blue / 255.0)

                    text.css({
                        top: vpY + 'px',
                        left: vpX + 'px'
                    });

                    self.overlay.append(text);
                }
            };

            this.reload = function(aPlanetsUrl, aToken) {
                self.planetsUrl = aPlanetsUrl;
                self.token = aToken;
                self.fetchPlanets();
                self.updateOverlay();
            }
        };

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: true,
            controller: controller,
            controllerAs: 'starmap',
            link: function(scope, element, attrs, controller) {
                element[0].reload = function(aPlanetsUrl, aToken) {
                    controller.reload(aPlanetsUrl, aToken);
                };

                var w = element.parent()[0].offsetWidth;
                var h = element.parent()[0].offsetHeight;
                controller.setSize(w, h);

                element.addClass('starmap');

                // create text overlay
                var overlay = angular.element('<div/>');
                overlay.addClass('starmapOverlay');
                element.append(overlay);

                // create UI overlay
                var ui = angular.element('<div><div/>');
                ui.addClass('starmapUI');
                element.append(ui);

                controller.setOverlays(overlay, ui);

                // init 2D Canvas and WebGL (three.js) systems
                controller.initializeGraphics(element);

                if (attrs.url) {
                    controller.reload(attrs.url, attrs.token);
                }
            }
        };
    });

    mod.directive('planetBrief', function($templateRequest, $compile) {

        this.controller = function($scope, $attrs, $http, $sce) {
            var self = this;
            var token = null;
            $scope.posX = 0;
            $scope.posY = 0;

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

                $scope.owner = p.ownerName;
                $scope.terrain = p.terrain;
                $scope.recharge = p.rechargeTime;
                $scope.industry = p.industry;
                $scope.chargeStation = p.chargeStation;
                $scope.capital = p.capitalPlanet;
                $scope.factory = p.factory;

                // if there is an active battle on the planet, follow the link and get the details
                if (p.battleId) {
                    $http({
                        url: p._links.battle.href,
                        method: 'GET',
                        headers: {
                            'X-NBT-Token': self.token === null ? '' : self.token,
                            'X-NBT-Activation-Form': window.location + "/activation.html"
                        }
                    }).then(self.updatePlanetBattleDetail);
                    $scope.isBattle = true;
                }

                // if there is/are a factory/factories on the planet, follow the link and get the details
            };

            this.setPlanet = function(aPlanet, aToken, aScreenPos) {
                $scope.posX = aScreenPos.x;
                $scope.posY = aScreenPos.y;

                $scope.name = '(fetching)';
                $scope.description = null;
                $scope.owner = '(fetching)';
                $scope.terrain = '(fetching)';
                $scope.recharge = '(fetching)';

                self.token = aToken;

                $http({
                    url: aPlanet._links.self.href,
                    method: 'GET',
                    headers: {
                        'X-NBT-Token': aToken === null ? '' : aToken
                    }
                }).then(self.updatePlanet);
            };

            this.clear = function() {
                $scope.name = null;
                $scope.capital = null;
                $scope.description = null;
                $scope.owner = null;
                $scope.terrain = null;
                $scope.recharge = null;
                $scope.battleId = null
                $scope.battleAttacker = null
                $scope.battleType = null
                $scope.battleLaunched = null;
                $scope.isBattle = false;
                $scope.chargeStation = null;
                $scope.factory = null;
                $scope.industry = null;
            };
        };

        return {
            restrict: 'E',
            controller: controller,
            controllerAs: 'brief',
            link: function(scope, element, attrs, controller) {
                element[0].setPlanet = function(aPlanet, aToken, aScreenPos) {
                    controller.setPlanet(aPlanet, aToken, aScreenPos);
                }

                element[0].clear = function() {
                    controller.clear();
                }

                var i18n = 'en';

                if (attrs.lang) i18n = attrs.lang;

                $templateRequest('/templates/' + i18n + '/starmap/planetBrief.html').then(function(html) {
                    var templ = angular.element(html);
                    element.append(templ);
                    $compile(templ)(scope);
                });
            }
        };
    });
})();
