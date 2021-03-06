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
    var app = angular.module('nbt.app');

    app.directive('starmap', function($templateRequest, $compile) {

        this.controller = function($scope, $attrs, $rootScope, nbtLeague, nbtIdentity, nbtPlanet) {
            var mStarmapDebug;
            try { mStarmapDebug = starmapDebug; } catch (e) { mStarmapDebug = false; }

            var MapLayer = {
                PLANETS: 0,
                CAPITALS: 1,
                FACTORIES: 2,
                CHARGESTATIONS: 3,
                COMBATUNITS: 4,
                DROPSHIPS: 5,
                JUMPSHIPS: 6,
                SECTORS: 7,
                BATTLES: 8,

                NORMAL_JUMP: 9,
                SPECIAL_JUMP: 10
            };

            var self = this;

            $scope.showPlanetBrief = false;
            $scope.planetNames = [];
            $scope.planetNameToPlanetMap = {};
            $scope.planetIdToPlanetMap = {};

            // planet data from service
            this.planets = null;

            // quadtree to reduce overdraw
            this.quadtree = null;

            // per-faction map colors
            this.mapColors = null;

            // starmap width and height (from parent size)
            this.width = 0;
            this.height = 0;

            function saveMapPreferences() {
                var settings = {
                    showCapitalPlanets: $scope.showCapitalPlanets,
                    showChargeStations: $scope.showChargeStations,
                    showFactories: $scope.showFactories,
                    showBattles: $scope.showBattles,
                    showJumpships: $scope.showJumpships,
                    showCombatUnits: $scope.showCombatUnits,
                    showDropships: $scope.showDropships,
                    displaySectorBounds: $scope.displaySectorBounds
                };

                localStorage.setItem("mapPreferences", JSON.stringify(settings));
            }

            function restoreMapPreferences() {
                var entry = localStorage.getItem("mapPreferences");
                if (entry) {
                    var settings = JSON.parse(entry);
                    $scope.showCapitalPlanets = settings.showCapitalPlanets ? settings.showCapitalPlanets : true;
                    $scope.showChargeStations = settings.showChargeStations ? settings.showChargeStations : true;
                    $scope.showFactories = settings.showFactories ? settings.showFactories : true;
                    $scope.showBattles = settings.showBattles ? settings.showBattles : true;
                    $scope.showJumpships = settings.showJumpships ? settings.showJumpships : true;
                    $scope.showCombatUnits = settings.showCombatUnits ? settings.showCombatUnits : true;
                    $scope.showDropships = settings.showDropships ? settings.showDropships : true;
                    $scope.displaySectorBounds = settings.displaySectorBounds ? settings.displaySectorBounds : false;
                } else {
                    $scope.showCapitalPlanets = true;
                    $scope.showChargeStations = true;
                    $scope.showFactories = true;
                    $scope.showBattles = true;
                    $scope.showJumpships = true;
                    $scope.showCombatUnits = true;
                    $scope.showDropships = true;
                    $scope.displaySectorBounds = false;
                    saveMapPreferences();
                }
            }

            restoreMapPreferences();

            var updateMapColors = function(aMapColorData) {
                self.mapColors = aMapColorData;

                // convert the returned object to a hashtable
                self.mapColors = {};
                for (var i=0; i<aMapColorData.length; ++i) {
                    var mc = aMapColorData[i];
                    self.mapColors[mc.factionName] = mc;
                }
            };

            var updatePlanets = function(aPlanets) {
                self.planets = aPlanets;

                // get the "bounding area" of all of the planets
                var minX = Infinity;
                var minY = Infinity;
                var maxX = -Infinity;
                var maxY = -Infinity;

                var planetNames = [];
                $scope.planetNameToPlanetMap = {};

                for (var g=0; g < aPlanets.length; ++g) {
                    var group = aPlanets[g];
                    var ownerName;

                    try {
                        ownerName = group.owner.displayName;
                    } catch (e) {
                        ownerName = 'Unassigned';
                    }

                    for (var i = 0; i < group.planets.length; ++i) {
                        var p = group.planets[i];
                        planetNames.push({name: p.name, id: p.id, owner: ownerName, position: {x: p.x, y: p.y}});
                        $scope.planetNameToPlanetMap[p.name] = p;
                        $scope.planetIdToPlanetMap[p.id] = p;

                        if (p.x < minX) minX = p.x;
                        if (p.x > maxX) maxX = p.x;
                        if (p.y < minY) minY = p.y;
                        if (p.y > maxY) maxY = p.y;
                    }
                }

                $scope.planetNames = planetNames;

                // create quadtree with dimensions specified in the data
                self.quadtree = new QuadTree({left: minX, right: maxX, top: maxY, bottom: minY});

                // ...aaaaaaand now go through planets again to insert them into the quadtree
                for (var g=0; g < aPlanets.length; ++g) {
                    var group = aPlanets[g];

                    for (var i = 0; i < group.planets.length; ++i) {
                        var p = group.planets[i];
                        p.parentGroup = group;
                        self.quadtree.insert(p);
                    }
                }
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
            };

            this.setOverlays = function(aText, aUI) {
                this.overlay = aText;
                this.ui = aUI;
            };

            // WebGL (3D, three.js) objects
            this.gl = null;
            this.scene3D = null;
            this.camera3D = null;

            // scene for each marker layer
            this.combatUnitRings = [];
            this.dropshipRings = [];
            this.jumpshipRings = [];
            this.factoryRings = [];
            this.battleRings = [];
            this.chargeStationRings = [];
            this.capitalPlanetRings = [];
            this.sectorBounds = [];

            // 30-, 60- and 500-LY rings
            this.rings3060 = null;

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

            this.originPlanet = null;
            this.destinationPlanet = null;
            this.jumpPath = [];
            this.chargeStationNetwork = null;
            var csWorker = new Worker("/js/nbt/workers/create-cs-network.js");

            csWorker.onmessage = function(results) {
                self.chargeStationNetwork = results.data;
            };

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
                    0,
                    10
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
                var ring500 = new THREE.RingGeometry(499.9, 500.1, 1000);

                var whtMtl = new THREE.MeshBasicMaterial();
                whtMtl.color.setRGB(1,1,1);
                var grnMtl = new THREE.MeshBasicMaterial();
                grnMtl.color.setRGB(0,1,0);
                var cyanMtl = new THREE.MeshBasicMaterial();
                cyanMtl.color.setRGB(0,1,1);

                var mesh30 = new THREE.Mesh(ring30, whtMtl);
                var mesh60 = new THREE.Mesh(ring60, grnMtl);
                var mesh500 = new THREE.Mesh(ring500, cyanMtl);

                mesh30.layers.set(MapLayer.NORMAL_JUMP);
                mesh60.layers.set(MapLayer.NORMAL_JUMP);
                mesh500.layers.set(MapLayer.SPECIAL_JUMP);

                self.rings3060.add(mesh30);
                self.rings3060.add(mesh60);
                self.rings3060.add(mesh500);

                // add mouse event handlers
                self.gl.domElement.addEventListener('mousewheel', self.onMouseWheel);

                // Firefox...
                self.gl.domElement.addEventListener('DOMMouseScroll', self.onMouseWheel);

                self.gl.domElement.addEventListener('mousedown', self.onMouseDown);
                self.gl.domElement.addEventListener('mouseup', self.onMouseUp);
                self.gl.domElement.addEventListener('mousemove', self.onMouseMove);
                self.gl.domElement.addEventListener('mouseleave', self.onMouseExit);
                window.addEventListener('resize', self.onWindowResized);
            };

            var updateSelectedPlanetRings = function(planet) {
                if (planet) {
                    self.rings3060.position.set(planet.x, planet.y, 0);
                    self.scene3D.add(self.rings3060);
                } else {
                    self.scene3D.remove(self.rings3060);
                }
            };

            this.onWindowResized = function(event) {
                var w = self.gl.domElement.parentElement.offsetWidth;
                var h = self.gl.domElement.parentElement.offsetHeight;
                self.setSize(w, h);
            };

            function makeRingMesh(innerRadius, outerRadius, material) {
                var ringGeom = new THREE.RingGeometry(innerRadius, outerRadius, 36);
                return new THREE.Mesh(ringGeom, material);
            }

            var redraw = function() {
                // update the camera layers to match the selected layers
                self.camera3D.layers.set(MapLayer.PLANETS);
                self.camera3D.layers.enable(MapLayer.NORMAL_JUMP);

                if ($scope.showSpecialJump)
                    self.camera3D.layers.enable(MapLayer.SPECIAL_JUMP);

                if ($scope.showBattles) self.camera3D.layers.enable(MapLayer.BATTLES);
                if ($scope.showDropships) self.camera3D.layers.enable(MapLayer.DROPSHIPS);
                if ($scope.showCapitalPlanets) self.camera3D.layers.enable(MapLayer.CAPITALS);
                if ($scope.showChargeStations) self.camera3D.layers.enable(MapLayer.CHARGESTATIONS);
                if ($scope.showCombatUnits) self.camera3D.layers.enable(MapLayer.COMBATUNITS);
                if ($scope.showFactories) self.camera3D.layers.enable(MapLayer.FACTORIES);
                if ($scope.showJumpships) self.camera3D.layers.enable(MapLayer.JUMPSHIPS);
                if ($scope.displaySectorBounds) self.camera3D.layers.enable(MapLayer.SECTORS);

                // draw the planet graphics
                self.gl.render(self.scene3D, self.camera3D);

                // update the text overlay
                self.updateOverlay();
            };

            var clearJumpPath = function() {
                if (self.jumpPath) {
                    self.scene3D.remove(self.jumpPath);
                }

                self.jumpPath = null;
            };

            var addJumpPath = function() {
                clearJumpPath();

                if (!(self.jumpPlan && self.jumpPlan.length))
                    return;

                var gray = new THREE.MeshBasicMaterial();
                gray.color.setRGB(0.5, 0.5, 0.5);

                var geom = new THREE.Geometry();

                for (var i=0; i<self.jumpPlan.length; ++i) {
                    var planet = self.jumpPlan[i];
                    geom.vertices.push(new THREE.Vector3(planet.x, planet.y, -1.0));
                }

                self.jumpPath = new THREE.Line(geom, gray);
                self.scene3D.add(self.jumpPath);
                redraw();
            };

            var showRings = function(rings, show) {
                for (var i=0; i<rings.length; ++i) {
                    var ring = rings[i];

                    if (show) self.scene3D.add(ring);
                    else self.scene3D.remove(ring);
                }
            };

            var showSectorBounds = function(bounds, show) {
                for (var i=0; i<bounds.length; ++i) {
                    var bound = bounds[i];

                    if (show) self.scene3D.add(bound);
                    else self.scene3D.remove(bound);
                }
            };

            var Color = {
                WHITE: 0,
                RED: 1,
                GREEN: 2,
                BLUE: 3,
                MAGENTA: 4,
                YELLOW: 5,
                CYAN: 6
            };

            var ringMaterials = [
                new THREE.MeshBasicMaterial({color: 0xFFFFFF}),
                new THREE.MeshBasicMaterial({color: 0xFF0000}),
                new THREE.MeshBasicMaterial({color: 0x00FF00}),
                new THREE.MeshBasicMaterial({color: 0x0000FF}),
                new THREE.MeshBasicMaterial({color: 0xFF00FF}),
                new THREE.MeshBasicMaterial({color: 0xFFFF00}),
                new THREE.MeshBasicMaterial({color: 0x00FFFF})
            ];

            function makePlanetDisc(planet, color) {
                var geom = new THREE.CircleGeometry(1, 18);
                var mtl = new THREE.MeshBasicMaterial();
                mtl.color.set(color);
                mtl.origColor = color;

                var obj = new THREE.Mesh(geom, mtl);
                obj.userData = planet;
                planet.graphics = obj;
                obj.position.set(planet.x, planet.y, 0);
                obj.layers.set(MapLayer.PLANETS);
                return obj;
            }

            function makeRings(planetObj) {
                var p = planetObj.userData;

                if (p.capitalPlanet) {
                    var ringObj = makeRingMesh(1.5, 1.7, ringMaterials[Color.MAGENTA]);
                    ringObj.layers.set(MapLayer.CAPITALS);
                    planetObj.add(ringObj);
                }

                if (p.chargeStation) {
                    var ringObj = makeRingMesh(1.8, 2.0, ringMaterials[Color.YELLOW]);
                    ringObj.layers.set(MapLayer.CHARGESTATIONS);
                    planetObj.add(ringObj);
                }

                if (p.factory) {
                    var ringObj = makeRingMesh(2.1, 2.3, ringMaterials[Color.WHITE]);
                    ringObj.layers.set(MapLayer.FACTORIES);
                    planetObj.add(ringObj);
                }

                if (p.parentGroup._links && p.parentGroup._links.battle) {
                    var ringObj = makeRingMesh(2.4, 2.6, ringMaterials[Color.RED]);
                    ringObj.layers.set(MapLayer.BATTLES);
                    planetObj.add(ringObj);
                }

                if (p.combatUnitCount) {
                    var ringObj = makeRingMesh(2.7, 2.9, ringMaterials[Color.GREEN]);
                    ringObj.layers.set(MapLayer.COMBATUNITS);
                    planetObj.add(ringObj);
                }

                if (p.dropshipCount) {
                    var ringObj = makeRingMesh(3.0, 3.2, ringMaterials[Color.CYAN]);
                    ringObj.layers.set(MapLayer.DROPSHIPS);
                    planetObj.add(ringObj);
                }

                if (p.jumpshipCount) {
                    var ringObj = makeRingMesh(3.3, 3.5, ringMaterials[Color.BLUE]);
                    ringObj.layers.set(MapLayer.JUMPSHIPS);
                    planetObj.add(ringObj);
                }
            }

            function getGroupColor(group) {
                var name;

                try {
                    name = group.owner.displayName;
                } catch (e) {
                    name = 'Unassigned';
                }

                var mapColor = self.mapColors[name];
                return (mapColor.planetColor.red << 16) | (mapColor.planetColor.green << 8) | (mapColor.planetColor.blue << 0);
            }

            this.reloadStarmapData = function() {
                self.scene3D = new THREE.Scene();
                self.scene3D.add(self.camera3D);
                self.sectorBounds = [];

                // plow through the planets, making objects, geometries and meshes along the way
                for (var g=0; g<self.planets.length; ++g) {
                    var group = self.planets[g];
                    var points = [];
                    var verts2D = [];

                    var groupColor = getGroupColor(group);

                    var disp = 1.0;
                    for (var i = 0; i < group.planets.length; ++i) {
                        var p = group.planets[i];
                        var x = p.x;
                        var y = p.y;

                        points.push(new THREE.Vector3(x, y, disp));
                        disp = 1.0 - disp;
                        verts2D.push([x, y]);

                        var planetObj = makePlanetDisc(p, groupColor);
                        self.scene3D.add(planetObj);

                        // add rings for various other properties
                        makeRings(planetObj);
                    }

                    // 598? Don't draw sector bounds "north" of Antinisus, it just gets messy
                    if (group.owner && points.length > 3 && p.y < 598) {
                        var sectorGeom = new THREE.ConvexBufferGeometry(points);
                        var sectorMtl = new THREE.MeshBasicMaterial();
                        sectorMtl.color.set(groupColor);
                        sectorMtl.transparent = true;
                        sectorMtl.opacity = 0.15;

                        var sectorMesh = new THREE.Mesh(sectorGeom, sectorMtl);
                        sectorMesh.layers.set(MapLayer.SECTORS);
                        self.scene3D.add(sectorMesh);
                    }
                }

                updateSelectedPlanetRings(self.selectedPlanet);
                addJumpPath();

                redraw();
            };

            this.onPlanetSelected = function(planet) {
                updateSelectedPlanetRings(planet);
                redraw();
            };

            var findObjectUnderMouse = function() {
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

                return obj;
            };

            this.onMouseWheel = function(event) {
                // calculate new zoom factor
                var zoom = self.camera3D.zoom;
                zoom += (event.wheelDelta / 600 || -event.detail / 8);

                if (zoom > 0.39 && zoom < 12.1) {
                    self.camera3D.zoom = zoom;
                    self.mapZoom = zoom;
                    self.camera3D.updateProjectionMatrix();

                    redraw();

                    event.preventDefault();
                }

                return false;
            };

            // can be called from child scopes if the map needs updating in part or in full
            $scope.onPlanetsUpdated = function(planets) {

            };

            $scope.selectedPlanets = [];

            var addToSelectedSet = function(planet) {
                $scope.selectedPlanets.push(planet);
                $scope.$apply();
            };
            
            var clearSelectedPlanets = function() {
                for (var i=0; i<$scope.selectedPlanets.length; ++i) {
                    var planet = $scope.selectedPlanets[i];
                    var origColor = planet.graphics.material.origColor;
                    planet.graphics.material.color.set(origColor);
                }
                redraw();

                $scope.selectedPlanets.length = 0;
                $scope.$apply();
            };

            function clearContextMenu() {
                $('#starmapContextMenu').hide();
            }

            function clearPlanetBrief() {
                if (self.hoverPlanetTimeout) clearTimeout(self.hoverPlanetTimeout);
                self.removePlanetBrief();
            }

            this.onMouseDown = function(event) {
                clearContextMenu();

                if (event.button === 0) { // just the LMB by itself
                    // move the camera on left-mouse down
                    self.state = 1;
                    self.lastX = event.offsetX;
                    self.lastY = event.offsetY;

                    // first, are we in editing state?
                    if ($scope.editMode) {
                        // start a planet rubberband-select operation
                        self.selectCornerA = { x: event.offsetX, y: event.offsetY };

                        if (event.ctrlKey) {
                            var obj = findObjectUnderMouse();
                            if (obj) {
                                obj.graphics.material.color.setRGB(1,1,1);
                                addToSelectedSet(obj);
                                redraw();
                            } else {
                                // clear selection set
                                clearSelectedPlanets();
                            }
                        }
                    } else {
                        if (!event.ctrlKey) {
                            // if we are in pathfinding state, just exit the state and leave the path
                            // in place; otherwise, treat it as a normal planet select
                            if (self.isPathfinding) {
                                self.isPathfinding = false;
                            } else {
                                var obj = findObjectUnderMouse();
                                self.selectedPlanet = obj;
                                self.originPlanet = obj;
                            }
                        }
                    }
                }

                return false;
            };

            function setSelectedPlanet(planet) {
                self.selectedPlanet = planet;
                self.onPlanetSelected(planet);

                // get the list of planets within 60LY
                var planets = [];

                if (planet) {
                    planets = self.quadtree.findAllWithinRadius(planet, 60.0);
                } else {
                    // remove any existing jump path
                    clearJumpPath();
                    redraw();
                }

                // call out
                $rootScope.$broadcast('planetChanged', planet, planets);
            }

            function setDestinationPlanet(planet) {
                self.destinationPlanet = planet;
                $rootScope.$broadcast('nbtDestinationPlanetChanged', planet);
            }

            this.onMouseUp = function(event) {
                if (event.button === 0) {
                    self.state = 0;

                    // CTRL means we are doing something and don't want the current selection unselected
                    if (event.ctrlKey)
                        return;

                    if ($scope.editMode) {
                        self.selectCornerA = null;
                    } else {
                        // then user wants to select something, find out what it is (if anything) and
                        // have something handle it
                        var vpW = self.camera3D.right - self.camera3D.left;
                        var vpH = self.camera3D.top - self.camera3D.bottom;
                        var w = vpW / self.camera3D.zoom;
                        var h = vpH / self.camera3D.zoom;
                        var l = self.offsetX - w / 2;
                        var t = self.offsetY + h / 2;

                        // normalized position in overlay viewport
                        var nx = event.offsetX / vpW;
                        var ny = event.offsetY / vpH;

                        var mouseX = nx * w + l;
                        var mouseY = t - ny * h;

                        var obj = null;
                        self.destinationPlanet = null;

                        if (self.quadtree)
                            obj = self.quadtree.find(mouseX, mouseY);

                        // if SHIFT, then selecting jump target
                        if (event.shiftKey)
                            setDestinationPlanet(obj);
                        else
                            setSelectedPlanet(obj);
                    }
                }

                return false;
            };

            this.onMouseExit = function(event) {
                self.state = 0;

                return false;
            };

            $scope.$watch('showCapitalPlanets', function(newValue, oldValue) {
                showRings(self.capitalPlanetRings, newValue);
                redraw();
                saveMapPreferences();
            });

            $scope.$watch('showChargeStations', function(newValue, oldValue) {
                showRings(self.chargeStationRings, newValue);
                redraw();
                saveMapPreferences();
            });

            $scope.$watch('showFactories', function(newValue, oldValue) {
                showRings(self.factoryRings, newValue);
                redraw();
                saveMapPreferences();
            });

            $scope.$watch('showBattles', function(newValue, oldValue) {
                showRings(self.battleRings, newValue);
                redraw();
                saveMapPreferences();
            });

            $scope.$watch('showDropships', function(newValue, oldValue) {
                showRings(self.dropshipRings, newValue);
                redraw();
                saveMapPreferences();
            });

            $scope.$watch('showJumpships', function(newValue, oldValue) {
                showRings(self.jumpshipRings, newValue);
                redraw();
                saveMapPreferences();
            });

            $scope.$watch('showCombatUnits', function(newValue, oldValue) {
                showRings(self.combatUnitRings, newValue);
                redraw();
                saveMapPreferences();
            });

            $scope.$watch('displaySectorBounds', function(newValue, oldValue) {
                showSectorBounds(self.sectorBounds, newValue);
                redraw();
                saveMapPreferences();
            });

            this.onPlanetSearch = function(position) {
                self.camera3D.position.x = self.offsetX = position.x;
                self.camera3D.position.y = self.offsetY = position.y;
                redraw();
            };

            $scope.$on("planetSearchRequest", function(event, planetName) {
                // find the planet in the $scope.planetNames map
                var planet = $scope.planetNameToPlanetMap[planetName];
                if (planet) {
                    self.onPlanetSearch(planet);
                    setSelectedPlanet(planet);
                }
            });

            $scope.$on("nbtPlanetUpdated", function(event, planet) {
                // rebuild the planet graphics representation (it may have changed owner, properties may be different now, etc)
                self.scene3D.remove(planet.graphics);
                // TODO: will this parentGroup always be right, coming as it does from somewhere else?
                var graphics = makePlanetDisc(planet, getGroupColor(planet.parentGroup));
                makeRings(graphics);
                self.scene3D.add(graphics);
                redraw();
            });

            this.drawSelectRect = function(cornerB) {
                if (!self.selectCornerA)
                    return;

                if (!self.selectRect) {
                    var plane = new THREE.PlaneGeometry(100,100);

                    var mtl = new THREE.MeshBasicMaterial({
                        color: 0x303030,
                        transparent: true,
                        opacity: 0.15
                    });

                    var mesh = new THREE.Mesh(plane, mtl);
                    self.selectRect = new THREE.Object3D();
                    self.selectRect.add(mesh);
                    self.selectRect.rotation.set(0, Math.PI/2, 0);
                    self.scene3D.add(self.selectRect);
                }

                // scale and reposition the rect as needed
                var dx = self.selectCornerA.x - cornerB.x;
                var dy = self.selectCornerA.y - cornerB.y;

                dx /= self.mapZoom;
                dy /= self.mapZoom;

                var sx = Math.abs(dx);
                var sy = Math.abs(dy);
                self.selectRect.scale.set(sx, sy, 1);

                var x = self.selectCornerA.x - dx / 2;
                var y = self.selectCornerA.y - dy / 2;
                self.selectRect.position.set(x, y, 0);

                console.log ("scale: %f, %f        pos: %f, %f", sx, sy, x, y);

                redraw();
            };

            this.hideSelectRect = function() {
                self.scene3D.remove(self.selectRect);
            };

            var moveCamera = function(newPosition) {
                var dX = self.lastX - newPosition.x;
                var dY = self.lastY - newPosition.y;

                dX /= self.mapZoom;
                dY /= self.mapZoom;

                self.lastX = newPosition.x;
                self.lastY = newPosition.y;

                self.camera3D.position.x += dX;
                self.camera3D.position.y -= dY;

                self.offsetX += dX;
                self.offsetY -= dY;

                redraw();
            };

            var findJumpPath = function(origin, destination) {
                var startTime = performance.now();

                // first, determine if we need to use the CS network at all...
                var planetInRangeList = self.quadtree.findAllWithinRadiusEx(origin, 60.0, function(planet) {
                    // "OK" only for planets with charge station
                    return (planet.id === destination.id);
                });

                if (planetInRangeList.length > 0) {
                    // the path is two long -- origin and the destination; make that list and return it
                    return [origin, destination];
                }

                // find the CS around the target planet -- termination condition is when the origin planet is in the
                // set of CS near the destination
                var destinationCS = self.quadtree.findAllWithinRadiusEx(destination, 60.0, function(planet) {
                    // "OK" only for planets with charge station
                    return (planet.chargeStation && planet.id !== destination.id);
                });

                //console.log('CS within range of destination:');
                for (var i=0; i<destinationCS.length; ++i) {
                    console.log('    ' + destinationCS[i].planet.name);
                }

                // get all CS planets within 60LY; once we are on the CS network, we can use the pre-computed
                // adjacency lists from there
                var originCS = self.quadtree.findAllWithinRadiusEx(origin, 60.0, function(planet) {
                    // "OK" only for planets with charge station
                    return (planet.chargeStation && planet.id !== origin.id);
                });

                // if there are no CS in range of the origin, exit early with null
                if (originCS.length === 0) {
                    return null;
                }

                var paths = [];
                var visited = {};
                var queue = [];

                // initialize with items from the CS network graph
                for (var i=0; i<originCS.length; ++i) {
                    queue.push(self.chargeStationNetwork[originCS[i].planet.id]);
                }

                // breadth-first search -- put each adjacent CS planet in a queue, then visit the queue one at a time,
                // putting each item's unvisited children in the queue. Mark each child with its parent CS so we can
                // reconstruct the path once we discover a CS in the destination set (which is the termination condition)

                while (queue.length > 0) {
                    var csPlanet = queue.shift();
                    visited[csPlanet.id] = csPlanet;

                    var idx = destinationCS.findIndex(function(elem, idx, arr) {
                        return elem.planet.id === csPlanet.id;
                    });

                    if (idx >= 0) {
                        // then we found a path, construct the path backwards and stash it for later review
                        var candidate = [];
                        candidate.push(csPlanet);
                        while (csPlanet.pathParent) {
                            candidate.push(csPlanet.pathParent);
                            csPlanet = csPlanet.pathParent;
                        }

                        paths.push(candidate);
                    } else {
                        // otherwise, put all of this CS planet's adjacent hops in the queue...if they have not yet
                        // been visited
                        for (var hopId in csPlanet.neighbors) {
                            // is this planet already in the set to be checked?
                            var idx = queue.findIndex(function(elem, idx, arr) {
                                return elem.id === csPlanet.id;
                            });

                            if (!visited[hopId] && idx < 0) {
                                var hop = csPlanet.neighbors[hopId];
                                hop.pathParent = csPlanet;
                                queue.push(hop);
                            }
                        }
                    }
                }

                // find a/the shortest path
                var path = null;
                for (var i=0; i<paths.length; ++i) {
                    if (path === null) {
                        path = paths[i];
                    } else {
                        if (paths[i].length < path.length) {
                            path = paths[i];
                        }
                    }
                }

                var rtn = [];
                if (path) {
                    rtn.push(origin);
                    while (path.length > 0) {
                        rtn.push(path.pop());
                    }
                    rtn.push(destination);
                }

                var elapsed = performance.now() - startTime;
                console.log('Shortest path search took ' + elapsed.toFixed(2) + ' ms');
                console.log('path is:');
                rtn.forEach(function(elem, idx, arr) { console.log('    ' + elem.name); });

                return rtn;
            };

            this.onMouseMove = function(event) {
                self.isPathfinding = event.shiftKey;

                var pos = {x: event.offsetX, y: event.offsetY};
                if (self.state === 1) {
                    moveCamera(pos);
                    return true;
                } else {
                    if (self.selectCornerA) {
                        self.drawSelectRect(pos);
                    } else {
                        var obj = findObjectUnderMouse();

                        if (obj) {
                            if (obj !== self.hoverPlanet) {
                                self.hoverPlanet = obj;

                                if (self.isPathfinding) { // the user is looking at jump paths
                                    self.destinationPlanet = obj;
                                    self.jumpPlan = findJumpPath(self.originPlanet, self.destinationPlanet);
                                    $rootScope.$broadcast('jumpPathChanged', self.jumpPlan);
                                    addJumpPath();
                                }

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
                }

                return false;
            };

            this.onContextMenuClicked = function(e) {
                var obj = findObjectUnderMouse();
                clearContextMenu();

                var ident = nbtIdentity.get();

                if (obj && (ident.isSiteAdmin() || ident.isLeagueAdmin())) {
                    clearPlanetBrief();

                    // show context menu at the click point
                    var menu = $('#starmapContextMenu');
                    menu.css({top: e.offsetY, left: e.offsetX});
                    menu.show();
                    return false;
                }

                return true;
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

                    var ownerName = 'Unassigned';
                    if (p.parentGroup.owner)
                        ownerName = p.parentGroup.owner.displayName;
                    
                    var mc = self.mapColors[ownerName];
                    var tc = new THREE.Color(mc.textColor.red / 255.0, mc.textColor.green / 255.0, mc.textColor.blue / 255.0);

                    text.css({
                        top: vpY + 'px',
                        left: vpX + 'px'
                    });

                    self.overlay.append(text);
                }
            };

            var currentLeague = null;

            this.reload = function() {
                if (currentLeague) {
                    $scope.mapLoading = true;
                    nbtPlanet.load(
                        currentLeague,
                        nbtIdentity.get().token
                    );
                } else {
                    setTimeout(self.reload, 1000);
                }
            };

            $scope.reloadData = function() {
                self.reload();
            };

            var cb = $scope.$on('nbtIdentityChanged', function(event, aIdent) {
                if (currentLeague) {
                    self.reload();
                }
            });
            $scope.$on('destroy', cb);

            var cb = $scope.$on('nbtFactionChanged', function(event, aFaction) {
                if (aFaction && aFaction.factionClass.displayName !== 'Inner Sphere') {
                    $scope.showSpecialJump = true;
                }
            });
            $scope.$on('destroy', cb);

            cb = $scope.$on('nbtLeagueChanged', function(event, aLeague) {
                if (aLeague) {
                    currentLeague = aLeague;
                    self.reload();
                }
            });
            $scope.$on('destroy', cb);

            cb = $scope.$on('nbtPlanetsLoaded', function(event, aLeagueId, aPlanets, aMapColors) {
                // update the internal data structures
                updatePlanets(aPlanets);
                updateMapColors(aMapColors);

                // kick off a worker task to create the charge station network
                try {
                    csWorker.postMessage({planetGroups: self.planets, quadtree: self.quadtree});
                } catch (e) {

                }

                // reset the map and overlay(s)
                var startTime = performance.now();
                self.reloadStarmapData();
                var elapsed = performance.now() - startTime;
                console.log(elapsed + 'ms to rebuild starmap');
                self.updateOverlay();
                $scope.mapLoading = false;
            });
            $scope.$on('destroy', cb);
        };

        return {
            restrict: 'E',
            template: '<div></div>',
            scope: true,
            controller: controller,
            controllerAs: 'starmap',
            link: function(scope, element, attrs, controller) {
                var w = element.parent()[0].offsetWidth;
                var h = element.parent()[0].offsetHeight;
                controller.setSize(w, h);

                element.addClass('starmap');

                element[0].oncontextmenu = controller.onContextMenuClicked;

                // create text overlay
                var overlay = angular.element('<div/>');
                overlay.addClass('starmapOverlay');
                overlay.attr('onwheel', 'console.log(\'overlay wheel\')');
                element.append(overlay);

                // create UI overlay
                var l10n = 'en';

                if (attrs.lang) l10n = attrs.lang;

                var ui = angular.element('<div/>');
                ui.addClass('starmapUI');
                element.append(ui);
                controller.setOverlays(overlay, ui);

                $templateRequest('/templates/' + l10n + '/starmap/ui.html').then(function(html) {
                    var content = angular.element(html);
                    $compile(content)(scope);
                    ui.append(content);
                });

                // init 2D Canvas and WebGL (three.js) systems
                controller.initializeGraphics(element);

                controller.reload();
            }
        };
    });

    app.directive('planetBrief', function($templateRequest, $compile) {

        this.controller = function($scope, $attrs, $sce, nbtIdentity, nbtPlanet, nbtBattle) {
            var self = this;
            var token = null;
            $scope.posX = 0;
            $scope.posY = 0;

            this.updatePlanetBattleDetail = function(battleData) {
                $scope.battleId = battleData.getId();

                var attacker = battleData.getAttacker();
                $scope.battleAttacker = attacker.name;
                $scope.battleType = battleData.getType();
                $scope.battleLaunched = battleData.getAttackDate();
            };

            this.updatePlanet = function(p) {
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

                if (p.parentGroup.sectorId > 0)
                    $scope.sector = p.parentGroup.sectorCapital.name;

                // if there is an active battle on the planet, follow the link and get the details
                if (p.battleId) {
                    nbtBattle.fetchBattleForPlanet(p, nbtIdentity.get().token, self.updatePlanetBattleDetail);
                    $scope.isBattle = true;
                }

                // if there is/are a factory/factories on the planet, follow the link and get the details
            };

            this.setPlanet = function(aPlanet, aToken, aScreenPos) {
                $scope.posX = aScreenPos.x;
                $scope.posY = aScreenPos.y;
                $scope.sector = null;

                $scope.name = '(fetching)';
                $scope.description = null;
                $scope.owner = '(fetching)';
                $scope.terrain = '(fetching)';
                $scope.recharge = '(fetching)';

                self.token = aToken;
                var hdrs = new Headers(Header.TOKEN, nbtIdentity.get().token);
                nbtPlanet.fetchPlanetDetail(aPlanet, aToken, self.updatePlanet);
            };

            this.clear = function() {
                $scope.name = null;
                $scope.capital = null;
                $scope.description = null;
                $scope.owner = null;
                $scope.sector = null;
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
                };

                element[0].clear = function() {
                    controller.clear();
                };

                var l10n = 'en';

                if (attrs.lang) l10n = attrs.lang;

                $templateRequest('/templates/' + l10n + '/starmap/planetBrief.html').then(function(html) {
                    var templ = angular.element(html);
                    element.append(templ);
                    $compile(templ)(scope);
                });
            }
        };
    });
})();
