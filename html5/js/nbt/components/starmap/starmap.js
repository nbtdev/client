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
    var app = angular.module('nbt.starmap', []);

    app.directive('starmap', function() {

        this.controller = function($scope, $attrs, $http) {
            var self = this;
            this.text = "(not set)";

            // planet data from service
            this.planets = null;

            // per-faction map colors
            this.mapColors = null;

            this.rootUrl = "";
            this.token = "";

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
                self.reset();
            }

            this.succeed = function(data) {
                self.text = data;
                self.planets = data.data;

                // fetch map color data
                $http({
                    method: 'GET',
                    url: self.rootUrl + '/system/mapColors'
                })
                    .then(self.onMapColorData, self.fail);
            };

            this.fail = function(msg) {
                self.text = "Failed: " + msg.statusText;
            };

            var fetchPlanets = function() {
                // temp hack -- do not hardcode resource paths
                var planetsUrl = self.rootUrl + "/leagues/1/planets";
                //var planetsUrl = 'http://localhost/planets.json';

                $http({
                        url: planetsUrl,
                        method: "GET",
                        headers: {'X-NBT-Token': self.token}
                })
                .then(self.succeed, self.fail);
            };

            this.setUrl = function(url, aToken) {
                self.rootUrl = url;

                if (!aToken) {
                    // temp hack -- do not hardcode resource paths
                    var tokenUrl = url + "/security/tokens";
                    var loginData = {username: "testuser", password: "testuser"};

                    $http.post(tokenUrl, loginData)
                        .then(function (data) {
                            self.token = data.token;
                            fetchPlanets();
                        });
                } else {
                    self.token = aToken;
                    fetchPlanets();
                }
            }

            this.setSize = function(w, h) {
                self.width = w;
                self.height = h;
            }

            this.setOverlays = function(aText, aUI) {
                this.overlay = aText;
                this.ui = aUI;
            }

            this.token = null;

            // reset the starmap, called after new data has been applied; this will
            // clear everything and start over from scratch
            this.reset = function() {
                // init planet objects from this.planets (depends on WebGL initialized first)
                this.reloadStarmapData();
            };

            // WebGL (3D, three.js) objects
            this.gl = null;
            this.scene3D = null;
            this.camera3D = null;

            // mouse manipulation state
            this.mapZoom = 1.0;

            // TODO: figure out how to do enums for this
            // 1: move map
            this.state = 0;

            this.lastX = 0;
            this.lastY = 0;

            // text overlay
            this.overlay = null;

            // UI overlay
            this.ui = null;

            // initialize the 2D (for text overlays and GUI) and 3D (for starmap itself) objects
            this.initializeGraphics = function(parent) {
                // create WebGL renderer, scene and camera
                this.gl = new THREE.WebGLRenderer();
                this.gl.setSize(this.width, this.height);

                this.scene3D = new THREE.Scene();

                this.camera3D = new THREE.OrthographicCamera(
                    this.width / -2,
                    this.width / 2,
                    this.height / 2,
                    this.height / -2,
                    1,
                    2
                );

                this.camera3D.position.x = 0;
                this.camera3D.position.y = 0;
                this.camera3D.position.z = 1;
                this.camera3D.zoom = this.mapZoom;

                this.scene3D.add(this.camera3D);

                this.gl.domElement.style.zIndex = 1;
                parent.append(this.gl.domElement);

                // add mouse event handlers
                this.gl.domElement.addEventListener('mousewheel', this.onMouseWheel);
                this.gl.domElement.addEventListener('mousedown', this.onMouseDown);
                this.gl.domElement.addEventListener('mouseup', this.onMouseUp);
                this.gl.domElement.addEventListener('mousemove', this.onMouseMove);
            };

            this.reloadStarmapData = function() {
                // plow through the planets, making objects, geometries and meshes along the way
                for (var i=0; i<this.planets._embedded.planets.length; ++i) {
                    var p = this.planets._embedded.planets[i];
                    var x = p.x;
                    var y = p.y;
                    var name = p.name;

                    var geom = new THREE.CircleGeometry(1, 18);
                    var mtl = new THREE.MeshBasicMaterial();
                    var mc = this.mapColors[p.ownerName];
                    var color = (mc.planetColor.red << 16) | (mc.planetColor.green << 8) | (mc.planetColor.blue << 0);
                    mtl.color.set(color);

                    var mesh = new THREE.Mesh(geom, mtl);
                    var obj = new THREE.Object3D();
                    obj.add(mesh);

                    obj.position.set(x, y, 0);
                    this.scene3D.add(obj);
                }

                this.gl.render(this.scene3D, this.camera3D);
            };

            this.onMouseWheel = function(event) {
                // calculate new zoom factor
                var zoom = self.camera3D.zoom;
                zoom += event.wheelDelta / 600;

                if (zoom > 0.39 && zoom < 12.1) {
                    self.camera3D.zoom = zoom;
                    self.mapZoom = zoom;
                    self.camera3D.updateProjectionMatrix();
                    self.gl.render(self.scene3D, self.camera3D);
                }

                event.cancelBubble = true;
                return false;
            };

            this.onMouseDown = function(event) {
                // move the camera on middle-mouse down
                if (event.button === 1) {
                    self.lastX = event.offsetX;
                    self.lastY = event.offsetY;
                    self.state = 1;
                }

                return false;
            };

            this.onMouseUp = function(event) {
                if (event.button === 1) {
                    self.state = 0;
                }

                return false;
            };

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
                    self.gl.render(self.scene3D, self.camera3D);
                }

                return false;
            };
        };

        return {
            restrict: 'E',
            //templateUrl: 'js/nbt/components/starmap/template.html',
            template: '<div></div>',
            controller: controller,
            controllerAs: 'starmap',
            link: function(scope, element, attrs, controller) {
                element[0].setUrl = function(url, token) {
                    controller.setUrl(url, token);
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
                var ui = angular.element('<div/>');
                ui.addClass('starmapUI');
                element.append(ui);

                controller.setOverlays(overlay, ui);

                // init 2D Canvas and WebGL (three.js) systems
                controller.initializeGraphics(element);

                // invoke any onLoad callback
                if (attrs.onload) {
                    var expr = attrs.onload + '(element[0])';
                    eval(expr);
                }
            }
        };
    });
})();
