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

    app.directive('sideMenu', function($templateRequest, $compile) {

        this.controller = function($scope, nbtIdentity, nbtRoot, nbtTools) {
            var self = this;
            var mIdentity = null;
            var mDrawer = null;
            var mTool = null;

            $scope.drawerOpened = false;

            function update() {
                $scope.isSiteAdmin = mIdentity ? mIdentity.isSiteAdmin() : false;
                $scope.isLeagueAdmin = mIdentity ? mIdentity.isLeagueAdmin() : false;
                $scope.isTeamAdmin = mIdentity ? mIdentity.isTeamAdmin() : false;
                $scope.isLoggedIn = mIdentity ? mIdentity.token : false;

                var tools = null;

                if ($scope.isSiteAdmin) tools = nbtTools.getTools(UserRole.SITE_ADMIN);
                else if ($scope.isLeagueAdmin) tools = nbtTools.getTools(UserRole.PRECENTOR);
                else if ($scope.isTeamAdmin) tools = nbtTools.getTools(UserRole.TEAM_LEADER);
                else tools = nbtTools.getTools(UserRole.GUEST);

                $scope.tools = tools;
            }

            var cb = $scope.$on('nbtIdentityChanged', function (event, identity) {
                $scope.drawerOpened = false;
                mIdentity = identity;
                update();
            });
            $scope.$on('destroy', cb);

            mIdentity = nbtIdentity.get();
            update();

            this.toggle = function (aToolName) {
                toggleDrawer(aToolName);
            };

            function toggleDrawer(requestingTool) {
                // if the drawer is opened and it was last
                // opened by this tool, close it
                if (mTool === requestingTool) {
                    $scope.drawerOpened = false;
                    mTool = null;
                    clearTool();
                    return;
                }

                // otherwise, make sure it's open and
                // set up this tool's contents
                $scope.drawerOpened = true;
                mTool = requestingTool;
                setupTool();
            }

            // remove the tool elements from the DOM
            function clearTool() {
                angular.element(self.mDrawer.children[1]).empty();
                $scope.currentToolName = null;
            }

            function setupTool() {
                // first clear any accidental leftovers...
                clearTool();

                var toolObj = $scope.tools[mTool];
                if (toolObj) {
                    // construct the tool UI elements from the template referenced
                    // in the tool definition
                    $templateRequest('/templates/' + nbtRoot.locale() + '/' + toolObj.template).then(function (html) {
                        var templ = angular.element(html);
                        angular.element(self.mDrawer.children[1]).append(templ);
                        $compile(templ)($scope);
                    });

                    $scope.currentToolName = toolObj.tooltip;
                }
            }

            this.setDrawer = function(drawer) {
                self.mDrawer = drawer;
            };
        };

        return {
            restrict: 'E',
            scope: true,
            controller: controller,
            controllerAs: 'menu',
            link: function(scope, element, attrs, controller) {
                var i18n = 'en';

                if (attrs.lang) i18n = attrs.lang;

                $templateRequest('/templates/' + i18n + '/tools/side_menu.html').then(function (html) {
                    var templ = angular.element(html);
                    element.append(templ);
                    $compile(templ)(scope);

                    // grab ahold of the drawer so we can populate its internals later
                    var elem = element[0].firstElementChild;
                    var drawer = elem.children[1];
                    controller.setDrawer(drawer);
                });
            }
        };
    });
})();

